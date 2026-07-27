export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/api/datos") {
            if (!env.DROPBOX_JSON_URL) {
                return new Response(
                    JSON.stringify({
                        error: "Falta configurar DROPBOX_JSON_URL"
                    }),
                    {
                        status: 500,
                        headers: {
                            "Content-Type": "application/json; charset=utf-8",
                            "Cache-Control": "no-store"
                        }
                    }
                );
            }

            try {
                const response = await fetch(env.DROPBOX_JSON_URL, {
                    headers: {
                        Accept: "application/json"
                    }
                });

                if (!response.ok) {
                    return new Response(
                        JSON.stringify({
                            error: `Dropbox respondió HTTP ${response.status}`
                        }),
                        {
                            status: 502,
                            headers: {
                                "Content-Type": "application/json; charset=utf-8",
                                "Cache-Control": "no-store"
                            }
                        }
                    );
                }

                const datos = await response.text();

                return new Response(datos, {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Cache-Control": "no-store, no-cache, must-revalidate",
                        "X-Content-Type-Options": "nosniff"
                    }
                });

            } catch (error) {
                return new Response(
                    JSON.stringify({
                        error: "No fue posible obtener los datos desde Dropbox"
                    }),
                    {
                        status: 500,
                        headers: {
                            "Content-Type": "application/json; charset=utf-8",
                            "Cache-Control": "no-store"
                        }
                    }
                );
            }
        }

        return env.ASSETS.fetch(request);
    }
};
