export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // =====================================================
        // API PARA OBTENER EL JSON DESDE DROPBOX
        // =====================================================
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
                const respuestaDropbox = await fetch(
                    env.DROPBOX_JSON_URL.trim(),
                    {
                        method: "GET",
                        redirect: "follow",
                        headers: {
                            "Accept": "application/json,text/plain,*/*",
                            "User-Agent": "Cloudflare-Worker"
                        }
                    }
                );

                if (!respuestaDropbox.ok) {
                    return new Response(
                        JSON.stringify({
                            error: "Dropbox respondió con error",
                            status: respuestaDropbox.status,
                            statusText: respuestaDropbox.statusText
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

                const texto = await respuestaDropbox.text();

                // Verificar que Dropbox realmente devolvió un JSON.
                let datos;

                try {
                    datos = JSON.parse(texto);
                } catch {
                    return new Response(
                        JSON.stringify({
                            error: "Dropbox no devolvió un JSON válido",
                            respuestaInicial: texto.slice(0, 200)
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

                if (!Array.isArray(datos)) {
                    return new Response(
                        JSON.stringify({
                            error: "El archivo JSON no contiene una lista de registros"
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

                return new Response(
                    JSON.stringify(datos),
                    {
                        status: 200,
                        headers: {
                            "Content-Type": "application/json; charset=utf-8",
                            "Cache-Control": "no-store, no-cache, must-revalidate",
                            "X-Content-Type-Options": "nosniff"
                        }
                    }
                );

            } catch (error) {
                return new Response(
                    JSON.stringify({
                        error: "No fue posible obtener los datos desde Dropbox",
                        detalle: error instanceof Error
                            ? error.message
                            : String(error)
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

        // =====================================================
        // SERVIR EL DASHBOARD
        // =====================================================
        return env.ASSETS.fetch(request);
    }
};
