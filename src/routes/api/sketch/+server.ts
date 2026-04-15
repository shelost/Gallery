import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env.OPENAI_API_KEY;
	if (!apiKey) {
		return json({ error: 'API key not configured' }, { status: 500 });
	}

	const { imageBase64, prompt, mode } = await request.json();

	if (!imageBase64) {
		return json({ error: 'No image provided' }, { status: 400 });
	}

	const stylePrompt = prompt || 'A fully colored and shaded Korean historical comic panel with vibrant colors, clean lines, and professional coloring.';

	try {
		if (mode === 'describe') {
			return await describeSketch(apiKey, imageBase64);
		}

		return await completeSketch(apiKey, imageBase64, stylePrompt);
	} catch (err) {
		console.error('Sketch API error:', err);
		return json({ error: 'Failed to process sketch' }, { status: 500 });
	}
};

async function describeSketch(apiKey: string, imageBase64: string) {
	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content: `You are an expert comic art director. Analyze the provided sketch/line art and produce a highly detailed visual description that could be used to recreate the scene as a fully finished, colored illustration. Focus on:
- Character poses, expressions, clothing, and accessories
- Background elements, architecture, and environment
- Panel composition, perspective, and framing
- Any text/speech bubbles and their approximate content
- The overall mood and atmosphere

Be extremely specific and visual. Your description will be used to generate the finished artwork.`
				},
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: 'Describe this comic panel sketch in vivid detail for an artist to complete it as a fully colored, finished comic panel:'
						},
						{
							type: 'image_url',
							image_url: {
								url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
							}
						}
					]
				}
			],
			max_tokens: 800
		})
	});

	if (!response.ok) {
		const err = await response.text();
		console.error('Vision API error:', err);
		return json({ error: 'Failed to analyze sketch' }, { status: 500 });
	}

	const data = await response.json();
	const description = data.choices?.[0]?.message?.content || '';

	return json({ description });
}

async function completeSketch(apiKey: string, imageBase64: string, stylePrompt: string) {
	const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content: 'You are an expert comic art director. Describe the sketch in one concise paragraph focusing on visual elements: characters, poses, clothing, background, composition. Be specific but brief (under 150 words). This will be used as a DALL-E prompt.'
				},
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: 'Describe what is in this comic panel sketch:'
						},
						{
							type: 'image_url',
							image_url: {
								url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
							}
						}
					]
				}
			],
			max_tokens: 300
		})
	});

	if (!visionResponse.ok) {
		const err = await visionResponse.text();
		console.error('Vision API error:', err);
		return json({ error: 'Failed to analyze sketch' }, { status: 500 });
	}

	const visionData = await visionResponse.json();
	const sketchDescription = visionData.choices?.[0]?.message?.content || '';

	const fullPrompt = `${stylePrompt}. Scene: ${sketchDescription}. Style: professional comic book illustration, clean coloring, detailed shading, high quality digital art.`;

	const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: 'dall-e-3',
			prompt: fullPrompt.slice(0, 4000),
			n: 1,
			size: '1024x1024',
			quality: 'hd',
			response_format: 'b64_json'
		})
	});

	if (!imageResponse.ok) {
		const err = await imageResponse.text();
		console.error('DALL-E API error:', err);
		return json({ error: 'Failed to generate image' }, { status: 500 });
	}

	const imageData = await imageResponse.json();
	const generatedImageB64 = imageData.data?.[0]?.b64_json;
	const revisedPrompt = imageData.data?.[0]?.revised_prompt;

	if (!generatedImageB64) {
		return json({ error: 'No image generated' }, { status: 500 });
	}

	return json({
		image: `data:image/png;base64,${generatedImageB64}`,
		description: sketchDescription,
		revisedPrompt: revisedPrompt
	});
}
