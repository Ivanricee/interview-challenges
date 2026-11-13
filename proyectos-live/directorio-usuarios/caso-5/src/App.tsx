import { useEffect, useRef, useState, useTransition } from "react";

import api from "./api";
import { User } from "./types";
type usersType = {
  users: User[];
  total: number;
};
function App() {
  const [users, setUsers] = useState<usersType>({ users: [], total: 0 });
  const viewPortRef = useRef<HTMLDivElement | null>(null);
  const observerTargetRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const [isPending, startTransition] = useTransition();
  function handleLoadMore(start: number, count: number) {
    isLoadingRef.current = true;
    startTransition(async () => {
      await api.list({ start, count }).then((result) => {
        setUsers((users) => ({
          ...users,
          users: [...users.users, ...result.items],
          total: result.total,
        }));
      });
    });
    isLoadingRef.current = false;
  }

  useEffect(() => {
    handleLoadMore(0, 8);
  }, []);
  useEffect(() => {
    const options = {
      root: document,
      rootMargin: "0px",
      scrollMargin: "0px",
      threshold: 1.0,
    };
    const callback = (
      entries: IntersectionObserverEntry[],
      observer: IntersectionObserver,
    ) => {
      entries.forEach((entry) => {
        if (
          entry.isIntersecting &&
          !isLoadingRef.current &&
          users.users.length < users.total &&
          users.users.length > 0
        ) {
          handleLoadMore(users.users.length, 8);
        }
      });
    };
    const observer = new IntersectionObserver(callback, options);
    if (observerTargetRef.current) observer.observe(observerTargetRef.current);
    return () => observer.disconnect();
  }, [users.users]);
  return (
    <main ref={viewPortRef}>
      <h1>Directorio de usuarios</h1>
      <ul>
        {users.users.map((user) => (
          <li key={user.id}>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex justify-between" ref={observerTargetRef}>
        {users.users.length < users.total && users.users.length > 0 && (
          <button onClick={() => handleLoadMore(users.users.length, 8)}>
            Cargar más
          </button>
        )}
        <p>
          {users.users.length} usuarios de {users.total}
        </p>
        <p>{isPending ? "Cargando..." : "sssssssssssssssssss"}</p>
      </div>
    </main>
  );
}

export default App;
