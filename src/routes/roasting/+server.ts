import axios from 'axios';
import { error } from '@sveltejs/kit';
import { json } from "@sveltejs/kit";
import { RateLimiter } from 'sveltekit-rate-limiter/server';
import type { RequestHandler } from './$types';
import { OPENAI_PROXY_URL, OPENAI_MODEL, OPEN_AI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';
const limiter = new RateLimiter({
    // A rate is defined as [number, unit]
    IP: [20, 'm'], // IP address limiter
    IPUA: [10, 'm'], // IP + User Agent limiter
});

// export async function GET({ url }: RequestEvent) {
//     const name = url.searchParams.get('name');
//     const jsonData = await getProfile(name);
//     return json(jsonData);
// }

function infoIndo(biodata: any) {
    let info = "Nama : " + biodata.profile.name + " dengan biodata : ```" + JSON.stringify(biodata) + "```";

    return info;
}

function infoInggris(biodata: any) {
    let info = "Name : " + biodata.profile.name + " with bio : ```" + JSON.stringify(biodata) + "```";

    return info;
}

export const POST: RequestHandler = async (event) => {
    //limit request
    if (await limiter.isLimited(event)) {
        error(429);
    }

    const body = await event.request.json();
    const biodata = body.biodata;
    const language = body.language;
    try {
       
        let prompt = "roasting, ejek dan kata-katain  dengan kejam, menyakitkan hati dan menyindir untuk profil linkedin berikut gaunakan bahasa informal dan gunakan emotikon atau emoji bila perlu , " + infoIndo(biodata) + ". (hanya berikan response dengan singkat dalam bahasa indonesia. jangan gunakan tulisan/huruf china, jepang, arab, india dan thailand, hanya gunakan tulisan/huruf latin. jangan berikan pujian atau saran. berikan response kurang dari 100 kata. jangan mention nama-nama negara seperti (Rusia, China, Ukraina, Israel, Palestina, dll))";
        if (language == "English") {
            prompt = "roast linkedin profile below with harshly and sarcastic with slang language and use emoticon if needed, " + infoInggris(biodata) + ". (only give short response with english language . dont give praise or advice. give response less than 100 words. dont mention country names like (Russia, China, Ukraine, Israle, Palestine, etc))";
        }

        const client = new OpenAI({
            apiKey: OPEN_AI_API_KEY != "NULL" ? OPEN_AI_API_KEY : "",
            baseURL: OPENAI_PROXY_URL ?? 'https://api.openai.com',
        });

        const chatCompletion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: OPENAI_MODEL ?? 'gpt-4o-mini',
        });
        const data = chatCompletion.choices[0];

        
        // kalau mau pakei api gratisan
        // const url = "https://api.nyxs.pw/ai/gpt4?text=" + prompt;
        // const response = await fetch(url);
        // const data = await response.json();
        // data.text
        return json({
            roasting: data.message.content,
            biodata: biodata
        });

    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            return json({
                error: error.response?.data,
            }, { status: error.response?.status });
        }
        console.log(error);
        return json({
            error: error.message,
        }, { status: 500 });
    }
}