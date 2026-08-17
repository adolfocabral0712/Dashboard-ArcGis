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

                // =====================================================
                // CONVERTIR RESPUESTA DE DROPBOX A JSON
                // =====================================================
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

                // =====================================================
                // VALIDAR NUEVA ESTRUCTURA DEL JSON
                //
                // {
                //   "actualizado": "...",
                //   "cantidadRegistros": 11,
                //   "registros": [...]
                // }
                // =====================================================
                if (
                    !datos ||
                    typeof datos !== "object" ||
                    Array.isArray(datos) ||
                    !Array.isArray(datos.registros)
                ) {
                    return new Response(
                        JSON.stringify({
                            error: "El archivo JSON no contiene la estructura esperada",
                            estructuraEsperada: {
                                actualizado: "fecha/hora",
                                cantidadRegistros: "número",
                                registros: []
                            }
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

                // =====================================================
                // DEVOLVER EL JSON COMPLETO AL DASHBOARD
                // =====================================================
                return new Response(
                    JSON.stringify(datos),
                    {
                        status: 200,
                        headers: {
                            "Content-Type": "application/json; charset=utf-8",
                            "Cache-Control": "no-store, no-cache, must-revalidate",
                            "Pragma": "no-cache",
                            "Expires": "0",
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
