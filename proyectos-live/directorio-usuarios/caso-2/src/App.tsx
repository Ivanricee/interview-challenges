import { useEffect, useState } from "react";

import api from "./api";
import { User } from "./types";

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<null | number>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    api.search(query).then((query) => {
      if (!isCancelled) setUsers(query);
    });
    return () => {
      isCancelled = true;
    };
  }, [query]);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAdding(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    try {
      const newUser = await api.add({ name, email });
      setUsers((prevUsers) => prevUsers.concat(newUser));
    } finally {
      setIsAdding(false);
    }

    form.reset();
  }

  async function handleRemove(id: number) {
    setDeletingId(id);
    try {
      await api.remove(id);
    } finally {
      setDeletingId(null);
    }
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
  }

  return (
    <main>
      <h1>Directorio de usuarios</h1>
      <input
        placeholder="Buscar por nombre o email"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Nombre" />
        <input name="email" placeholder="Email" />
        <button type="submit">Agregar</button>
      </form>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <button className="remove" onClick={() => handleRemove(user.id)}>
              {deletingId && deletingId === user.id ? "Borrando" : "Borrar"}
            </button>
          </li>
        ))}
        {isAdding && (
          <li>
            <div>
              <strong>adding new user...</strong>
              <span>Newuser@mail.com</span>
            </div>
          </li>
        )}
      </ul>
    </main>
  );
}

export default App;
