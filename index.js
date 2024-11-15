export default {
  async fetch(request, env) {
    try {
      const tasks = [];
      
      // Check if AI binding is available
      if (!env.AI) {
        throw new Error('AI binding is not configured');
      }

      // Travel itinerary prompt
      let travelItinerary = {
        prompt: `Create a detailed 5-day travel itinerary for Paris for a cultural traveler during summer season with a $1000 budget. Consider these factors:
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
  "num_days": 5,
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
}`
      };
      let response = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', travelItinerary);
      tasks.push({ inputs: travelItinerary, response });

      return Response.json(tasks);
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({
        error: error.message || 'An error occurred',
        stack: error.stack
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
};
