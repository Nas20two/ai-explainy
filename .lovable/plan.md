
# AI Jargon Buster 🤖✨

A playful web app that translates confusing AI jargon into plain English — like explaining it to a 5-year-old, complete with emojis!

## Design & Feel
- **Colorful, playful theme** with friendly typography, rounded cards, and subtle animations
- Fun gradient backgrounds and bouncy interactions
- Emoji-enhanced explanations to make complex concepts approachable
- Fully responsive for mobile and desktop

## Core Feature: Jargon Buster
- Large text area where users paste a confusing AI sentence
- A big, fun "Explain It!" button
- AI-powered explanation appears below, streamed in real-time with a typing effect
- Explanations use simple language, analogies, and emojis (e.g., 🧠, 🤖, 🎲)

## Example Jargon Library
- A section with clickable example phrases users can tap to instantly see an explanation
- Examples like: "The LLM hallucinated", "Fine-tuning a transformer", "Prompt injection attack", etc.

## History of Explanations
- Past explanations are saved locally (browser storage) so users can revisit them
- Simple list view showing the original jargon and a preview of the explanation
- Option to clear history

## Copy & Share
- One-click copy button for each explanation
- Share button to copy a shareable text snippet to clipboard

## Backend
- A Supabase Edge Function powered by **Lovable AI** (Gemini) to generate the kid-friendly explanations
- Streaming responses for a smooth, real-time feel
