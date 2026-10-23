import { useEffect, useRef, useState } from "react";

import api from "./api";
import { User } from "./types";

function App() {
  const storagedSortAscending = localStorage.getItem("sortAscending");
  const sortAscendingState =
    storagedSortAscending && storagedSortAscending.length > 0
      ? JSON.parse(storagedSortAscending)
      : false;
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const sortAscending = useRef(sortAscendingState);

  useEffect(() => {
    const sortedStoragedUsers = localStorage.getItem("sortedUsers");
    const sortedUsers =
      sortedStoragedUsers && sortedStoragedUsers.length > 0
        ? JSON.parse(sortedStoragedUsers)
        : null;
    if (sortedUsers) {
      setUsers(sortedUsers || []);
    } else {
      api.list().then(setUsers);
    }
  }, []);
  const checkRepeatedEmail = (email: string) => {
    return users.some((user) => user.email === email);
  };
  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    if (!name || !email) {
      console.log("no hay nada", { name, email });
      setError("Todos los campos son requeridos");
    }
    if (!email.startsWith("@") && !email.endsWith(".com")) {
      setError("El email no es válido");
      return;
    }
    if (checkRepeatedEmail(email)) {
      setError("El email ya existe");
      return;
    }
    if (error.length > 0) setError("");
    setUsers((users) => users.concat({ id: Date.now(), name, email }));
    form.reset();
  }
  const orderByName = () => {
    const orderedUsers = [...users].sort((a, b) => {
      return sortAscending.current
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });
    sortAscending.current = !sortAscending.current;

    localStorage.setItem("sortedUsers", JSON.stringify(orderedUsers));
    localStorage.setItem(
      "sortAscending",
      JSON.stringify(sortAscending.current),
    );
    setUsers(orderedUsers);
  };
  return (
    <main>
      <h1>Directorio de usuarios</h1>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Nombre" required />
        <input name="email" placeholder="Email" required />
        <button>Agregar</button>
      </form>
      {error.length > 0 && (
        <div>
          <strong>Error:</strong> {error}
        </div>
      )}
      <button onClick={orderByName}>
        Ordenar {sortAscending.current ? "▲" : "▼"}
      </button>
      <ul>
        {users.map((user, i) => (
          <li
            key={user.id}
            className="animate-bounce [animation-iteration-count:1] [animation-fill-mode:both]"
            style={{
              animationDelay: `${i * 100}ms`,
              animationDuration: "300ms",
            }}
          >
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
