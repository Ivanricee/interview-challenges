import {
  startTransition,
  useEffect,
  useOptimistic,
  useRef,
  useState,
} from "react";

import api from "./api";
import { User } from "./types";
type actionType = "add" | "remove";
type Addaction = {
  type: "add";
  newUser: User;
};
type Removeaction = {
  type: "remove";
  id: number;
};
type historyType = {
  user: User;
  isCurrent: boolean;
  undo: () => void;
  redo: () => void;
};
type OptimisticAction = Addaction | Removeaction;
function asyncStartTransition(fn: () => Promise<void>) {
  return new Promise<void>((resolve, reject) => {
    startTransition(async () => {
      try {
        await fn();
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}
function App() {
  const [users, setUsers] = useState<User[]>([]);
  const historyUsersRef = useRef<historyType[]>([]);
  const historyAtRef = useRef(historyUsersRef.current.length);
  const busyRef = useRef(false);
  const [optimisticUsers, dispatchOptimisticUsers] = useOptimistic(
    users,
    (currentUsers, action: OptimisticAction): User[] => {
      const actions: Record<actionType, () => User[]> = {
        add: () => [...currentUsers, (action as Addaction).newUser],
        remove: () =>
          currentUsers.filter(
            (user) => user.id !== (action as Removeaction).id,
          ),
      };
      const fnAction = actions[action.type];
      return fnAction();
    },
  );

  useEffect(() => {
    api.list().then(setUsers);
  }, []);

  async function handleSubmit(
    formData: FormData,
    isFromHistory: boolean = false,
    prevUserId?: number,
  ) {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      dispatchOptimisticUsers({
        type: "add",
        newUser: { name, email, id: Date.now() },
      });
      const user = await api.add({ name, email });
      startTransition(() => {
        setUsers((users) => users.concat(user));
        //add action to history & move pointer

        if (isFromHistory && prevUserId) {
          historyUsersRef.current.forEach((entry) => {
            if (entry.user.id === prevUserId) entry.user.id = user.id;
          });
          return;
        }
        //remove redo items on new action
        historyUsersRef.current = historyUsersRef.current.slice(
          0,
          historyAtRef.current,
        );
        //remove latest entry in history if > 3
        const userHistoryLength = historyUsersRef.current.length;
        if (userHistoryLength >= 3) historyUsersRef.current.shift();

        historyUsersRef.current.push({
          user,
          isCurrent: !isFromHistory,
          async undo() {
            await asyncStartTransition(
              async () => await handleRemove(user, true),
            );
          },
          async redo() {
            await asyncStartTransition(
              async () => await handleSubmit(formData, true, user.id),
            );
          },
        });

        historyAtRef.current = historyUsersRef.current.length;
      });
    } finally {
      busyRef.current = false;
    }
  }

  async function handleRemove(user: User, isFromHistory: boolean = false) {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const { id, email, name } = user;
      dispatchOptimisticUsers({ type: "remove", id });
      await api.remove(id);
      //add
      startTransition(() => {
        setUsers((users) => users.filter((user) => user.id !== id));
        //add action to history & move pointer

        if (isFromHistory) return;
        //remove redo items on new action
        historyUsersRef.current = historyUsersRef.current.slice(
          0,
          historyAtRef.current,
        );
        //remove latest entry in history if > 3
        const userHistoryLength = historyUsersRef.current.length;
        if (userHistoryLength >= 3) historyUsersRef.current.shift();
        historyUsersRef.current.push({
          user,
          isCurrent: !isFromHistory,

          async undo() {
            const formData = new FormData();
            formData.set("id", "dummyId");
            formData.set("name", user.name);
            formData.set("email", user.email);
            console.log("creado con", { id });
            await asyncStartTransition(
              async () => await handleSubmit(formData, true, user.id),
            );
          },
          async redo() {
            console.log("debio borrar aqui", { id });
            await asyncStartTransition(
              async () => await handleRemove(user, true),
            );
          },
        });
        historyAtRef.current = historyUsersRef.current.length;
        console.log("remove hsitoru", historyAtRef.current);
      });
    } finally {
      busyRef.current = false;
    }
  }
  useEffect(() => {
    async function onKeyDown(e: KeyboardEvent) {
      if (busyRef.current) return;
      const ctrl = e.ctrlKey;
      const shift = e.shiftKey;
      const isZ = e.key.toLocaleLowerCase() === "z";
      if (!ctrl || !isZ) return;
      const historyLength = historyUsersRef.current.length;
      if (shift) {
        if (historyAtRef.current < historyLength) {
          await historyUsersRef.current[historyAtRef.current].redo();
          historyAtRef.current++;
        }
        return;
      }
      //undo
      //move pointer to current history z
      if (
        historyLength > 0 &&
        historyAtRef.current > 0 &&
        historyAtRef.current <= historyLength
      ) {
        await historyUsersRef.current[historyAtRef.current - 1].undo();
        historyAtRef.current--;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main>
      <h1>Directorio de usuarios</h1>
      <form action={handleSubmit}>
        <input name="name" placeholder="Nombre" />
        <input name="email" placeholder="Email" />
        <button type="submit">Agregar</button>
      </form>
      <ul>
        {optimisticUsers.map((user) => (
          <li key={user.id}>
            <div>
              <strong>{user.id}</strong>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <button
              className="remove"
              onClick={async () =>
                await asyncStartTransition(
                  async () => await handleRemove(user, false),
                )
              }
            >
              Borrar
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
