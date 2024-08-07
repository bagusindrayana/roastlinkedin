import axios from 'axios';
import { error } from '@sveltejs/kit';
import { json } from "@sveltejs/kit";
import { RateLimiter } from 'sveltekit-rate-limiter/server';
import type { RequestHandler } from './$types';
import { COOKIES, CRSF_TOKEN, OPENAI_PROXY_URL, OPENAI_MODEL, OPEN_AI_API_KEY } from '$env/static/private';
const limiter = new RateLimiter({
    // A rate is defined as [number, unit]
    IP: [20, 'm'], // IP address limiter
    IPUA: [10, 'm'], // IP + User Agent limiter
});

//kalau logout dari linkedin, cookie dan crsf token akan berubah
const cookie = COOKIES;
const crsf = CRSF_TOKEN;
const headers = {
    'authority': 'www.linkedin.com',
    'accept': 'application/vnd.linkedin.normalized+json+2.1',
    'accept-language': 'en-GB,en;q=0.9,en-US;q=0.8,id;q=0.7',
    'cookie': cookie,
    'csrf-token': crsf,
    'referer': 'https://www.linkedin.com/',
    'sec-ch-ua': '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
    'x-li-lang': 'in_ID',
    'x-li-page-instance': 'urn:li:page:d_flagship3_profile_view_base_skills_details;TttQY4DTS7uz+mSndtcOhQ==',
    'x-li-pem-metadata': 'Voyager - Profile=view-skills-details',
    'x-li-track': '{"clientVersion":"1.13.21104","mpVersion":"1.13.21104","osName":"web","timezoneOffset":8,"timezone":"Asia/Singapore","deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":1,"displayWidth":1920,"displayHeight":1080}',
    'x-restli-protocol-version': '2.0.0'
};


function getUserId(link: string) {
    console.log(link);
    if (link.includes('http')) {
        const linkSplit = link.split('/');
        return linkSplit[4];
    } 
    if (link.includes('www.linkedin.com')) {
        const linkSplit = link.split('/');
        return linkSplit[2];
    } 
    if (link.includes('linkedin.com')) {
        const linkSplit = link.split('/');
        return linkSplit[2];
    }
    else {
        return link;
    }
    

}

async function getProfile(name: string | null) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(vanityName:' + name + ')&queryId=voyagerIdentityDashProfiles.aeba67850e106299f25de2eb3828c641',
        headers: headers
    };

    const result = await axios(config);
    const jsonData = result.data;
    return jsonData;
}

async function getSkill(entityUrn: string) {
    const entities = entityUrn.split(':');
    const last = entities[entities.length - 1];
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(profileUrn:urn%3Ali%3Afsd_profile%3A' + last + ',sectionType:skills)&queryId=voyagerIdentityDashProfileComponents.12633aa7fe473f5c7c1cb3aa88bb46fa',
        headers: headers
    }

    const result = await axios(config);
    const jsonData = result.data;
    return jsonData;
}

async function getExperience(entityUrn: string) {
    const entities = entityUrn.split(':');
    const last = entities[entities.length - 1];
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(profileUrn:urn%3Ali%3Afsd_profile%3A' + last + ',sectionType:experience,locale:in_ID)&queryId=voyagerIdentityDashProfileComponents.12633aa7fe473f5c7c1cb3aa88bb46fa',
        headers: headers
    };

    const result = await axios(config);
    const jsonData = result.data;
    return jsonData;
}

function extractInclude(includes: any[]) {
    const datas: any[] = [];
    for (let x = 0; x < includes.length; x++) {
        const inc = includes[x];
        if (inc.components != undefined) {
            for (let i = 0; i < inc.components.elements.length; i++) {
                const element = inc.components.elements[i].components;
                if (element.entityComponent != null && element.entityComponent.titleV2 != null) {
                    const cek = datas.find((item) => item.name == element.entityComponent.titleV2.text.text);
                    if (!cek) {
                        datas.push({
                            name: element.entityComponent.titleV2.text.text,
                            description: (element.entityComponent.subtitle ? element.entityComponent.subtitle.text : '') + " " + (element.entityComponent.caption ? element.entityComponent.caption.text : ''),
                        })
                    }
                }


            }
        }
    }
    return datas;
}

export const POST: RequestHandler = async (event) => {
    //limit request
    if (await limiter.isLimited(event)) {
        error(429);
    }

    const body = await event.request.json();
    const link = body.link;
    const name = getUserId(link);
    try {
        const profileData = await getProfile(name);
        if (profileData.included == undefined || profileData.included.length == 0) {
            return json({
                "error": "Profile not found"
            }, { status: 404 });
        }
        const entityUrn = profileData.included[0].entityUrn;
        // const profileUrn = await getProfileUrn(entityUrn);

        let profile = null
        let education = null
        for (let i = 0; i < profileData.included.length; i++) {
            const element = profileData.included[i];
            if (element.$type == "com.linkedin.voyager.dash.feed.miniupdate.MiniUpdate" && profile == null) {
                profile = {
                    "name": element.actor.name.text,
                    "bio": element.actor.description.text,
                }
            } else if (element.$type == "com.linkedin.voyager.dash.identity.profile.Profile" && profile == null && element["*edgeSetting"] != null && element.firstName != null) {
                profile = {
                    "name": element.firstName + ' ' + element.lastName,
                    "bio": element.headline,
                }

            } else if (element.$type == "com.linkedin.voyager.dash.identity.profile.Education" && education == null) {
                education = {
                    name: element.schoolName,
                }
            }

        }

        if (profile == null) {
            profile = {
                "name": name,
            }
        }

        let biodata: any = {};
        if (entityUrn) {
            const dataSkills = await getSkill(entityUrn);
            const skills = extractInclude(dataSkills.included);



            const dataExperiences = await getExperience(entityUrn);
            const experience = extractInclude(dataExperiences.included);

            biodata = {
                "profile": profile,
                "education": education,
                "skills": skills,
                "experience": experience
            };
        } else {
            return json({
                "error": "Profile not found"
            }, { status: 404 });
        }

        if(biodata.profile == null){
            return json({
                "error": "Profile not found"
            }, { status: 404 });
        }
        
        return json({
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