import axios from 'axios';
import { error } from '@sveltejs/kit';
import { json } from "@sveltejs/kit";
import { RateLimiter } from 'sveltekit-rate-limiter/server';
import type { RequestHandler } from './$types';
import { OPENAI_PROXY_URL, OPENAI_MODEL, OPEN_AI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';
import { dev } from '$app/environment';
const limiter = new RateLimiter({
    // A rate is defined as [number, unit]
    IP: [15, 'm'], // IP address limiter
    IPUA: [10, 'm'], // IP + User Agent limiter
});


function infoIndo(biodata: any) {
    let info = "Nama : " + biodata.profile.name + " dengan biodata : ```" + JSON.stringify(biodata) + "```";

    return info;
}

function infoInggris(biodata: any) {
    let info = "Name : " + biodata.profile.name + " with bio : ```" + JSON.stringify(biodata) + "```";

    return info;
}

export const POST: RequestHandler = async (event) => {
    const allowedOrigins = ['https://roastlinkedin.vercel.app', 'roastlinkedin.vercel.app','roastlinkedin.my.id','https://roastlinkedin.my.id'];
    const origin = event.request.headers.get('origin');
    const headersCors: {
        'Access-Control-Allow-Methods': string;
        'Access-Control-Allow-Headers': string;
        'Access-Control-Allow-Origin'?: string;
    } = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if(dev){
        headersCors['Access-Control-Allow-Origin'] = '*';
    } else {
        if (!allowedOrigins.includes(origin ?? '')) {
            error(403, 'Forbidden');
        } else {
            headersCors['Access-Control-Allow-Origin'] = origin!;
        }
    }

    //limit request
    if (await limiter.isLimited(event)) {
        error(429);
    }

    const body = await event.request.json();
    const biodata = body.biodata;
    const language = body.language;
    try {
       
        let prompt = "berikan roasting singkat dengan kejam,menyindir, serta menyakitkan dalam bahasa gaul untuk profile linkedin berikut : " + infoIndo(biodata) + ". (hanya berikan response dengan singkat dalam bahasa indonesia. jangan berikan pujian atau saran. berikan response kurang dari 100 kata.)";
        if (language == "English") {
            prompt = "give a short and harsh roasting for the following linkedin profile  " + infoInggris(biodata) + ". (only give short response with english language . dont give praise or advice. give response less than 100 words)";
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
        },{
            headers: headersCors
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