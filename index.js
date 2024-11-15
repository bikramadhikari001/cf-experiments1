// Error handling utility
function handleError(error, headers = {}) {
  console.error('Error:', error);
  
  const errorResponse = {
    error: error.message || 'An internal error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  return new Response(JSON.stringify(errorResponse), {
    status: error.status || 500,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

// Prompt generation utility
function generatePrompt(destination, num_days, travel_style, budget = 'moderate') {
  return `Create a detailed ${num_days}-day travel itinerary for ${destination} for a ${travel_style} traveler with a ${budget} budget.

Consider these factors:
1. Seasonal weather and appropriate activities
2. Local cultural events and festivals during this season
3. Opening hours and peak times of attractions
4. Local customs and etiquette
5. Budget-appropriate dining and activity options
6. Efficient route planning to minimize travel time
7. Adequate rest periods between activities
8. Local meal times and dining customs

For each day, include:
- Morning: [Activity/Place] (Time) [Budget] - [Description] - Include any cultural notes or tips
- Afternoon: [Activity/Place] (Time) [Budget] - [Description] - Include any cultural notes or tips
- Evening: [Activity/Place] (Time) [Budget] - [Description] - Include any cultural notes or tips

Additional considerations:
- Include estimated travel times between locations
- Note any required reservations or advance bookings
- Mention dress codes or cultural etiquette where relevant
- Suggest alternative indoor activities for weather-dependent plans
- Include budget-saving tips and local insights

Please provide the itinerary in the following JSON format:
{
  "num_days": ${num_days},
  "days": [
    {
      "morning": {
        "activities": "[Activity/Place]",
        "time": "[Time]",
        "budget": "[Budget]",
        "description": "[Description]",
        "cultural_notes": "[Cultural Notes or Tips]",
        "tiktok_url": "https://www.tiktok.com/search?q=[Location]"
      },
      "afternoon": {
        "activities": "[Activity/Place]",
        "time": "[Time]",
        "budget": "[Budget]",
        "description": "[Description]",
        "cultural_notes": "[Cultural Notes or Tips]",
        "tiktok_url": "https://www.tiktok.com/search?q=[Location]"
      },
      "evening": {
        "activities": "[Activity/Place]",
        "time": "[Time]",
        "budget": "[Budget]",
        "description": "[Description]",
        "cultural_notes": "[Cultural Notes or Tips]",
        "tiktok_url": "https://www.tiktok.com/search?q=[Location]"
      }
    }
    // Repeat for each day
  ]
}`;
}

// Main worker export
export default {
  async fetch(request, env) {
    try {
      // Add CORS headers to allow frontend requests
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: corsHeaders
        });
      }

      // Check if AI binding is available
      if (!env.AI) {
        throw new Error('AI binding is not configured');
      }

      const url = new URL(request.url);

      // Route handling
      if (url.pathname === '/api/v1/itinerary/generate' && request.method === 'POST') {
        // Parse request body
        const data = await request.json();
        const { destination, num_days, travel_style, budget } = data;

        // Validate required fields
        if (!destination || !num_days || !travel_style) {
          return new Response(JSON.stringify({
            error: 'Missing required fields: destination, num_days, or travel_style'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Validate num_days range
        if (typeof num_days !== 'number' || num_days < 1 || num_days > 14) {
          return new Response(JSON.stringify({
            error: 'Number of days must be between 1 and 14'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Generate AI prompt
        const prompt = generatePrompt(destination, num_days, travel_style, budget);

        console.log('Sending prompt to AI...');
        // Call Cloudflare AI
        const response = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
          prompt: prompt
        });
        console.log('Received AI response:', response);

        // Parse and validate AI response
        let itinerary;
        try {
          // If response is already an object, use it directly
          if (typeof response === 'object') {
            itinerary = response;
          } else {
            // Try to extract JSON from the response text
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              itinerary = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No valid JSON found in response');
            }
          }
        } catch (e) {
          console.error('Parse error:', e);
          throw new Error(`Failed to parse AI response: ${e.message}`);
        }

        // Validate itinerary structure
        if (!itinerary.days || !Array.isArray(itinerary.days)) {
          throw new Error('Invalid itinerary format received from AI');
        }

        // Validate and fix each day's structure
        itinerary.days = itinerary.days.map((day, index) => {
          const validateTimeSlot = (slot) => {
            if (!slot || typeof slot !== 'object') {
              return {
                activities: 'No activity planned',
                time: 'N/A',
                budget: budget || 'moderate',
                description: 'No description available',
                cultural_notes: 'No cultural notes available',
                tiktok_url: `https://www.tiktok.com/search?q=${destination}+activities`
              };
            }
            return {
              activities: slot.activities || 'No activity planned',
              time: slot.time || 'N/A',
              budget: slot.budget || budget || 'moderate',
              description: slot.description || 'No description available',
              cultural_notes: slot.cultural_notes || 'No cultural notes available',
              tiktok_url: slot.tiktok_url || `https://www.tiktok.com/search?q=${encodeURIComponent(slot.activities || destination)}`
            };
          };

          return {
            morning: validateTimeSlot(day.morning),
            afternoon: validateTimeSlot(day.afternoon),
            evening: validateTimeSlot(day.evening)
          };
        });

        // Add metadata
        const enrichedItinerary = {
          ...itinerary,
          metadata: {
            destination,
            travel_style,
            budget,
            generated_at: new Date().toISOString()
          }
        };

        return new Response(JSON.stringify({
          itinerary: enrichedItinerary
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // 404 for unmatched routes
      return new Response('Not Found', {
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      return handleError(error, corsHeaders);
    }
  }
};
