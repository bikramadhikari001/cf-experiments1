export default {
  async fetch(request, env) {
    try {
      const tasks = [];
      
      // Check if AI binding is available
      if (!env.AI) {
        throw new Error('AI binding is not configured');
      }

      // prompt - simple completion style input
      let simple = {
        prompt: 'Tell me a joke about Cloudflare'
      };
      let response = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', simple);
      tasks.push({ inputs: simple, response });

      // messages - chat style input
      let chat = {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Who won the world series in 2020?' }
        ]
      };
      response = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', chat);
      tasks.push({ inputs: chat, response });

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
