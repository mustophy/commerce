import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import jwt, { Secret } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import concatHeader from '@framework/api/utils/concat-cookie';

const clientId = process.env.NEXT_PUBLIC_CLIENT_ID
const clientSecret: Secret = process.env.NEXT_PUBLIC_CLIENT_SECRET!;
const storeHash = process.env.NEXT_PUBLIC_STORE_HASH;
const storeUrl = process.env.NEXT_PUBLIC_STORE_URL;
const bigCommerceApi = process.env.NEXT_PUBLIC_API_PATH
const apiToken = process.env.NEXT_PUBLIC_API_TOKEN


function getSsoLoginUrl(customerId: any) {
    const dateCreated = Math.round((new Date()).getTime() / 1000);
    const payload = {
        "iss": clientId,
        "iat": dateCreated,
        "jti": uuidv4(),
        "operation": "customer_login",
        "store_hash": storeHash,
        "customer_id": customerId,
        "redirect_to": "/"
    }
    let token = jwt.sign(payload, clientSecret, { algorithm: 'HS256' });
    return `${storeUrl}/login/token/${token}`;
};

async function getCustomerId(email: any) {
    const response = await fetch(`${bigCommerceApi}customers?email:in=${email}`, {
        method: 'GET',
        headers: {
            'X-Auth-Token': apiToken!
        },
    })
    const jsonResponse = await response.json()
    const customerId = jsonResponse.data[0]?.id
    console.log('idf', customerId)
    return customerId
}

function getCookie(header: string | null, cookieKey: string) {
    if (!header) return null
    const cookies: string[] = header.split(/, (?=[^;]+=[^;]+;)/)
    return cookies.find(cookie => cookie.startsWith(`${cookieKey}=`))
}

const ssoLoginApi: NextApiHandler = async (request, response) => {
    const { email } = request.query
    console.log(request.query)
    const customerId = await getCustomerId(email)
    console.log(customerId)
    if (customerId != undefined) {
        const ssoLoginUrl = getSsoLoginUrl(customerId)
        const { headers } = await fetch(ssoLoginUrl, {
            redirect: "manual" // Important!
        })

        // Set-Cookie returns several cookies, we only want SHOP_TOKEN
        let shopToken = getCookie(headers.get('Set-Cookie'), 'SHOP_TOKEN')

        if (shopToken && typeof shopToken === 'string') {
            const { host } = request.headers
            // OPTIONAL: Set the cookie at TLD to make it accessible on subdomains (embedded checkout)
            shopToken = shopToken + `; Domain=${host?.includes(':') ? host?.slice(0, host.indexOf(':')) : host}`

            // In development, don't set a secure shopToken or the browser will ignore it
            if (process.env.NODE_ENV !== 'production') {
                shopToken = shopToken.replace(/; Secure/gi, '')
                // console.log('shopToken_replaced', shopToken)
                // SameSite=none can't be set unless the shopToken is Secure
                // bc seems to sometimes send back SameSite=None rather than none so make
                // this case insensitive
                shopToken = shopToken.replace(/; SameSite=none/gi, '; SameSite=lax')
            }
            await response.setHeader(
                'Set-Cookie',
                concatHeader(response.getHeader('Set-Cookie'), shopToken)!
            )
            return response.status(200).json({ result: "success" })
        }
    }
    return response.status(500).json({ error: "Invalid authentication" })
}

export default ssoLoginApi