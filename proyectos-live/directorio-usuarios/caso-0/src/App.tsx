import { useDeferredValue, useEffect, useState, useTransition } from "react";

import api from "./api";
import { User } from "./types";

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const isPending = deferredQuery !== query;
  const matches = users.filter((user) => {
    return user.name.toUpperCase().includes(query.toLocaleUpperCase());
  });

  useEffect(() => {
    const getUsers = async () => {
      const responseUsers = await api.list();
      setUsers(responseUsers);
    };
    getUsers();
  }, []);

  return (
    <main>
      <div className="flex justify-between">
        <h1>Directorio de usuarios</h1>
        <p>{users.length} usuarios</p>
      </div>
      <input
        placeholder="Buscar por nombre"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {isPending ? (
        <p>Cargando...</p>
      ) : (
        <ul>
          {matches.map((user) => (
            <li key={user.id}>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-center">
        {matches.length === 0 ? (
          <p>Sin resultados</p>
        ) : (
          <small>
            {matches.length} resultados de {users.length} encontrados
          </small>
        )}
      </div>
    </main>
  );
}

export default App;
