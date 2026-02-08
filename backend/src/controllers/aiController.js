const Anthropic = require('@anthropic-ai/sdk');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const getClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
};

const SYSTEM_PROMPT = `You are a helpful and knowledgeable booking assistant for SmartBook Tashkent, a platform for booking venues in Tashkent, Uzbekistan. You help users find the perfect venue for their needs.

You know about:
- Restaurants and cafes (Uzbek, international, fusion cuisine)
- Stadiums and sports venues
- Fitness centers and gyms
- Barbershops
- Car wash services

All venues are located in Tashkent, with districts including Yunusabad, Mirzo Ulugbek, Chilanzar, Yakkasaray, Sergeli, and Almazar.

Currency is UZS (Uzbek Som). Price ranges: $ (budget), $$ (moderate), $$$ (upscale), $$$$ (fine dining).

Be friendly, concise, and helpful. Recommend venues based on user preferences. When suggesting venues, explain why each is a good match. If asked about booking, guide users through the process. Respond in the language the user speaks (English, Russian, or Uzbek).`;

exports.getRecommendations = async (req, res) => {
  try {
    const { preferences, date, time, guests, cuisine, district, price_range } = req.body;

    // Fetch matching venues from DB
    const conditions = ['v.is_active = 1'];
    const params = [];
    let paramIndex = 1;

    if (cuisine) {
      conditions.push(`v.cuisine_type ILIKE $${paramIndex++}`);
      params.push(`%${cuisine}%`);
    }
    if (district) {
      conditions.push(`v.district = $${paramIndex++}`);
      params.push(district);
    }
    if (price_range) {
      conditions.push(`v.price_range <= $${paramIndex++}`);
      params.push(parseInt(price_range));
    }

    const venues = await query(
      `SELECT v.name, v.type, v.district, v.cuisine_type, v.price_range, v.rating, v.total_reviews, v.description, v.amenities, v.id
       FROM venues v WHERE ${conditions.join(' AND ')} ORDER BY v.rating DESC LIMIT 10`,
      params
    );

    // Get user's past bookings for context
    let userHistory = '';
    if (req.user) {
      const history = await query(
        `SELECT v.name, v.type, v.cuisine_type, r.rating
         FROM bookings b JOIN venues v ON b.venue_id = v.id
         LEFT JOIN reviews r ON r.booking_id = b.id AND r.user_id = $1
         WHERE b.user_id = $1 AND b.status = 'completed'
         ORDER BY b.created_at DESC LIMIT 5`,
        [req.user.id]
      );
      if (history.rows.length > 0) {
        userHistory = `\n\nUser's recent visits: ${history.rows.map(h => `${h.name} (${h.cuisine_type}, rated ${h.rating || 'unrated'})`).join(', ')}`;
      }
    }

    const anthropic = getClient();
    if (!anthropic) {
      // Fallback: return top-rated venues without AI
      return res.json({
        recommendations: venues.rows.slice(0, 5).map(v => ({
          venue: v,
          reason: `Highly rated ${v.type} in ${v.district} with ${v.rating} stars from ${v.total_reviews} reviews.`,
        })),
        aiPowered: false,
      });
    }

    const userMessage = `User preferences: ${preferences || 'not specified'}
Date: ${date || 'flexible'}, Time: ${time || 'flexible'}, Guests: ${guests || 'not specified'}
Preferred cuisine: ${cuisine || 'any'}, District: ${district || 'any'}, Budget: ${price_range ? '$'.repeat(price_range) : 'any'}
${userHistory}

Available venues:
${venues.rows.map((v, i) => `${i + 1}. ${v.name} - ${v.type} in ${v.district} | Cuisine: ${v.cuisine_type || 'N/A'} | Rating: ${v.rating}/5 (${v.total_reviews} reviews) | Price: ${'$'.repeat(v.price_range)} | ${v.description?.substring(0, 100)}`).join('\n')}

Recommend the top 3-5 best matching venues with brief explanations. Format as JSON array with fields: venue_index (1-based), venue_name, reason.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const aiResponse = message.content[0].text;

    // Try to parse AI JSON response
    let recommendations;
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        recommendations = parsed.map(rec => ({
          venue: venues.rows[rec.venue_index - 1],
          reason: rec.reason,
        })).filter(r => r.venue);
      }
    } catch {
      // If JSON parsing fails, return raw AI response with venues
      recommendations = venues.rows.slice(0, 5).map(v => ({
        venue: v,
        reason: `Recommended by AI assistant`,
      }));
    }

    res.json({
      recommendations: recommendations || [],
      aiResponse: aiResponse,
      aiPowered: true,
    });
  } catch (err) {
    logger.error('AI recommendations error:', err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
};

exports.chat = async (req, res) => {
  try {
    const { message, conversation_id } = req.body;

    // Get conversation history
    let history = [];
    if (req.user && conversation_id) {
      const historyResult = await query(
        `SELECT role, content FROM ai_chat_history
         WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
        [req.user.id]
      );
      history = historyResult.rows.reverse();
    }

    // Get venue context
    const venueContext = await query(
      `SELECT name, type, district, cuisine_type, price_range, rating
       FROM venues WHERE is_active = 1 ORDER BY rating DESC LIMIT 15`
    );

    const contextInfo = `\n\nAvailable venues in Tashkent:\n${venueContext.rows.map(v => `- ${v.name} (${v.type}, ${v.district}, ${v.cuisine_type || 'N/A'}, ${'$'.repeat(v.price_range)}, ${v.rating}★)`).join('\n')}`;

    const anthropic = getClient();
    if (!anthropic) {
      return res.json({
        reply: "I'm currently unavailable. Please try again later or browse our venues directly!",
        aiPowered: false,
      });
    }

    const messages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message + contextInfo },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const reply = response.content[0].text;

    // Save to chat history
    if (req.user) {
      await query(
        `INSERT INTO ai_chat_history (user_id, role, content) VALUES ($1, 'user', $2), ($1, 'assistant', $3)`,
        [req.user.id, message, reply]
      );
    }

    res.json({ reply, aiPowered: true });
  } catch (err) {
    logger.error('AI chat error:', err);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
};

exports.selectTable = async (req, res) => {
  try {
    const { venue_id, preferences, guests_count, date } = req.body;

    const tables = await query(
      `SELECT vt.*,
        CASE WHEN EXISTS (
          SELECT 1 FROM bookings b WHERE b.table_id = vt.id AND b.booking_date = $2 AND b.status IN ('confirmed', 'pending')
        ) THEN false ELSE true END as is_available_now
       FROM venue_tables vt
       WHERE vt.venue_id = $1
       ORDER BY vt.table_number`,
      [venue_id, date || new Date().toISOString().split('T')[0]]
    );

    const availableTables = tables.rows.filter(t => t.is_available_now && t.capacity >= (guests_count || 1));

    const anthropic = getClient();
    if (!anthropic || availableTables.length === 0) {
      // Simple selection logic
      const sorted = availableTables.sort((a, b) => {
        if (preferences?.includes('vip') && a.is_vip !== b.is_vip) return b.is_vip ? 1 : -1;
        return Math.abs(a.capacity - (guests_count || 2)) - Math.abs(b.capacity - (guests_count || 2));
      });

      return res.json({
        suggestedTable: sorted[0] || null,
        availableTables,
        reason: sorted[0] ? `Best fit for ${guests_count || 2} guests based on capacity and availability.` : 'No available tables match your criteria.',
        aiPowered: false,
      });
    }

    const tableInfo = availableTables.map(t =>
      `Table ${t.table_number} (${t.label}): ${t.shape}, seats ${t.capacity}, position (${t.position_x}, ${t.position_z}), ${t.is_vip ? 'VIP' : 'Standard'}, multiplier: ${t.price_multiplier}x`
    ).join('\n');

    const aiMessage = `Help select the best table for ${guests_count || 2} guests.
User preferences: ${preferences || 'none specified'}
Available tables:\n${tableInfo}
Respond with JSON: { "table_number": N, "reason": "explanation" }`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: 'You are a table selection assistant. Pick the best table based on preferences and respond with JSON only.',
      messages: [{ role: 'user', content: aiMessage }],
    });

    let suggestion;
    try {
      const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
      suggestion = JSON.parse(jsonMatch[0]);
    } catch {
      suggestion = { table_number: availableTables[0]?.table_number, reason: 'Best available option' };
    }

    const suggestedTable = availableTables.find(t => t.table_number === suggestion.table_number) || availableTables[0];

    res.json({
      suggestedTable,
      availableTables,
      reason: suggestion.reason,
      aiPowered: true,
    });
  } catch (err) {
    logger.error('AI table selection error:', err);
    res.status(500).json({ error: 'Failed to select table' });
  }
};
