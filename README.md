# cf-experiments1

## Overview
This project is a Cloudflare Worker that interacts with a language model to generate responses to both simple and chat-style prompts. It demonstrates how to use Cloudflare's AI bindings to integrate AI capabilities into a serverless function.

## How It Works
The worker handles HTTP requests and uses the AI binding to send prompts to a language model. It supports two types of prompts:
- **Simple Completion**: A single prompt string is sent to the model.
- **Chat Style**: A list of messages, each with a role (`system` or `user`), is sent to the model.

The responses from the model are collected and returned as a JSON array.

## Running the Project
1. **Install Wrangler CLI**: If you haven't already, install the Wrangler CLI by running:
   ```bash
   npm install -g @cloudflare/wrangler
   ```
2. **Authenticate with Cloudflare**: Log in to your Cloudflare account using:
   ```bash
   wrangler login
   ```
3. **Publish the Worker**: Deploy the worker to Cloudflare by running:
   ```bash
   wrangler publish
   ```
4. **Test the Worker**: Once deployed, you can test the worker by sending HTTP requests to its URL. You can use tools like `curl` or Postman to send requests and view the responses.

## Configuration
- **AI Binding**: The worker uses an AI binding named `AI`. Ensure that this binding is properly configured in your Cloudflare account before deploying the worker.
