export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // =====================================================
        // API PRIVADA PARA OBTENER EL JSON
        // =====================================================
        if (url.pathname === "/api/datos") {
            try {
                const respuestaDropbox = await fetch(env.DROPBOX_JSON_URL, {
                    headers: {
                        Accept: "application/json"
                    },
                    cf: {
                        cacheTtl: 0,
                        cacheEverything: false
                    }
                });

                if (!respuestaDropbox.ok) {
                    return new Response(
                        JSON.stringify({
                            error: `Error al leer Dropbox: HTTP ${respuestaDropbox.status}`
                        }),
                        {
                            status: 502,
                            headers: {
                                "Content-Type": "application/json; charset=UTF-8"
                            }
                        }
                    );
                }

                const datos = await respuestaDropbox.text();

                return new Response(datos, {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json; charset=UTF-8",
                        "Cache-Control": "no-store, no-cache, must-revalidate",
                        "X-Content-Type-Options": "nosniff"
                    }
                });

            } catch (error) {
                return new Response(
                    JSON.stringify({
                        error: "No fue posible obtener los datos"
                    }),
                    {
                        status: 500,
                        headers: {
                            "Content-Type": "application/json; charset=UTF-8"
                        }
                    }
                );
            }
        }

        // =====================================================
        // SERVIR LOS ARCHIVOS HTML
        // =====================================================
        return env.ASSETS.fetch(request);
    }
};
