"use client";

import { useEffect, useState } from "react";

type Url = {
  id: number;
  source: string;
  url: string;
};

type EndpointMap = {
  [id: number]: string[]; // id da URL → lista de endpoints
};

type ExpandedMap = {
  [id: number]: boolean; // controle do expandido/colapsado
};

export default function UrlList() {
  const [urls, setUrls] = useState<Url[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newSource, setNewSource] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [endpointsMap, setEndpointsMap] = useState<EndpointMap>({});
  const [expandedMap, setExpandedMap] = useState<ExpandedMap>({});

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const SWAGGER_EDITOR_URL = process.env.NEXT_PUBLIC_SWAGGER_EDITOR_URL!;

  const filteredUrls = urls.filter((url) => {
    const term = searchTerm.toLowerCase();
  
    const matchesSourceOrUrl =
      url.source.toLowerCase().includes(term) ||
      url.url.toLowerCase().includes(term);
  
    const matchesEndpoint = endpointsMap[url.id]?.some((ep) =>
      ep.toLowerCase().includes(term)
    );
  
    return matchesSourceOrUrl || matchesEndpoint;
  });

  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/urls`);
        const data = await res.json();
        setUrls(data);
  
        // Buscar os endpoints de cada URL
        const endpointMap: EndpointMap = {};
        for (const url of data) {
          const resEndpoints = await fetch(`${API_BASE_URL}/api/urls/${url.id}/endpoints`);
          if (resEndpoints.ok) {
            const { endpoints } = await resEndpoints.json();
            endpointMap[url.id] = endpoints;
          }
        }
        setEndpointsMap(endpointMap);
      } catch (err) {
        console.error(err);
      }
    };
  
    fetchData();
  }, [API_BASE_URL]);
  

  const handleToggleEndpoints = async (id: number) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

    // Evita nova requisição se já tiver carregado
    if (endpointsMap[id]) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/urls/${id}/endpoints`);
      if (res.ok) {
        const data = await res.json();
        setEndpointsMap((prev) => ({
          ...prev,
          [id]: data.endpoints,
        }));
      } else {
        console.error("Erro ao buscar endpoints.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewInSwagger = (id: number) => {
    const swaggerUrl = `${SWAGGER_EDITOR_URL}/?url=${API_BASE_URL}/api/urls/${id}/fetch`;
    window.open(swaggerUrl, "_blank");
  };

  const handleDelete = async (id: number) => {
    const confirm = window.confirm("Tem certeza que deseja excluir esta URL?");
    if (!confirm) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/urls/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUrls((prev) => prev.filter((url) => url.id !== id));
      } else {
        console.error("Erro ao deletar.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = async (url: Url) => {
    const newSource = prompt("Novo nome:", url.source);
    const newUrl = prompt("Nova URL:", url.url);
    if (!newSource || !newUrl) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/urls/${url.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: newSource, url: newUrl }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUrls((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        console.error("Erro ao atualizar.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!newSource.trim() || !newUrl.trim()) {
      alert("Preencha todos os campos.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/urls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: newSource, url: newUrl }),
      });

      if (res.ok) {
        const created = await res.json();
        setUrls((prev) => [...prev, created]);
        setNewSource("");
        setNewUrl("");
        setShowForm(false);
      } else {
        console.error("Erro ao criar.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 font-sans">
      <h1 className="text-2xl font-bold mb-6 text-center text-white">
        APIs Registradas
      </h1>

      {/* barra de busca e botão adicionar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por nome ou URL..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-2/3 p-3 border border-gray-300 rounded-[0.4rem] focus:outline-none focus:ring-2 focus:ring-[#2f9196] "
        />
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="bg-[#2f9196] hover:bg-[#376163] text-white font-medium py-2 px-4 rounded-[0.4rem] transition"
        >
          {showForm ? "Cancelar" : "Adicionar URL"}
        </button>
      </div>

      {/* formulário colapsável */}
      <div
        className={`collapsible bg-white rounded-[0.4rem] shadow-md border border-gray-200 space-y-3 transition-all duration-300 my-4 ${
          showForm ? "max-h-[500px] p-4 mt-4" : "max-h-0 p-0"
        }`}
      >
        {showForm && (
          <>
            <input
              type="text"
              placeholder="Nome da origem (ex: Financeiro)"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-[0.4rem] text-[#4a4d5a]"
            />
            <input
              type="text"
              placeholder="URL (ex: https://exemplo.com/openapi.yaml)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-[0.4rem] text-[#4a4d5a]"
            />
            <button
              onClick={handleCreate}
              className="bg-[#2f9196] hover:bg-[#376163] text-white font-medium py-2 px-4 rounded-[0.4rem] transition"
            >
              Salvar URL
            </button>
          </>
        )}
      </div>

      {/* lista de URLs */}
      <div className="grid grid-cols-1 gap-4">
        {filteredUrls.length > 0 ? (
          filteredUrls.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white shadow-md rounded-[0.4rem] border border-gray-200"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-[#4a4d5a] text-lg">
                    {item.source}
                  </h2>
                  <p className="text-sm text-gray-500">{item.url}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleEndpoints(item.id)}
                    className="bg-[#2f9196] hover:bg-[#216568] text-white font-medium py-2 px-3 rounded-[0.4rem] transition"
                  >
                    {expandedMap[item.id] ? "Ocultar" : "Ver endpoints"}
                  </button>
                  <button
                    onClick={() => handleViewInSwagger(item.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-[0.4rem] transition"
                  >
                    Swagger
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-3 rounded-[0.4rem] transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-[0.4rem] transition"
                  >
                    Excluir
                  </button>
                </div>
              </div>

              {expandedMap[item.id] && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-[0.4rem]">
                  {endpointsMap[item.id]?.length ? (
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {endpointsMap[item.id].map((ep) => (
                        <li key={ep}>{ep}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Nenhum endpoint encontrado.</p>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-white text-center">Nenhuma URL encontrada.</p>
        )}
      </div>
    </div>
  );
}
