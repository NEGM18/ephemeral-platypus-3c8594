// Netlify Serverless Function: gemini.js
// Proxies frontend requests to the Gemini API to protect the API key.

exports.handler = async function(event, context) {
    // Standard CORS headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json"
    };

    // Handle CORS preflight request
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: "Preflight OK" })
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: "Method Not Allowed" })
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { contents, systemInstruction } = body;

        if (!contents) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Bad Request", message: "Missing 'contents' in request body." })
            };
        }

        // API key must come from the Netlify environment variable — never hardcode it here.
        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: "Server Misconfigured", message: "GEMINI_API_KEY environment variable is not set." })
            };
        }

        // We use gemini-2.5-flash as the standard model
        const MODEL = "gemini-2.5-flash";
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

        // Build Gemini payload structure
        const payload = {
            contents: contents
        };

        // If system instructions are provided, pass them to the model configuration
        if (systemInstruction) {
            payload.systemInstruction = {
                parts: [{ text: systemInstruction }]
            };
        }

        // Fetch using global fetch API (native in Node 18+)
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = response.status === 200 || response.status === 201 
            ? await response.json() 
            : null;

        if (!data) {
            const errorText = await response.text();
            console.error("Gemini API Error Response:", errorText);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ error: "Gemini API Error", details: errorText })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("Serverless Function Exception:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Internal Server Error", message: error.message })
        };
    }
};
