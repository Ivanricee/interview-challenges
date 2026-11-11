import { ChangeEvent, useEffect, useRef, useState } from "react";

import api from "./api";
import { User } from "./types";

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [userChecked, setUserChecked] = useState<string[]>([]);
  const checkedRef = useRef<(HTMLInputElement | null)[]>([]);
  const selectAllCheckRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    api.list().then(setUsers);
  }, []);

  function handleRemove(id: number) {
    api.remove(id);

    setUsers((users) => users.filter((user) => user.id !== id));
  }
  const handleCheckChange = (e: ChangeEvent<HTMLInputElement>, id: number) => {
    const isChecket = e.currentTarget.checked;

    setUserChecked((userChecked) => {
      let filteredUserChecked = userChecked;

      if (!isChecket) {
        filteredUserChecked = userChecked.filter((user) => user !== String(id));
      }
      return isChecket
        ? [...filteredUserChecked, String(id)]
        : [...filteredUserChecked];
    });
  };
  const removeChecked = () => {
    userChecked.forEach((userId) => handleRemove(Number(userId)));
    setUserChecked([]);
  };
  const handleCheckAll = (e: ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.currentTarget.checked;
    let allChecked: string[] = [];
    checkedRef.current.forEach((checked) => {
      if (checked !== null) {
        checked.checked = isChecked;
        if (isChecked) allChecked.push(checked.id);
      }
    });
    setUserChecked(allChecked);
  };
  useEffect(() => {
    //-----------------------
    if (selectAllCheckRef.current) {
      selectAllCheckRef.current.indeterminate = false;

      if (userChecked.length > 0 && userChecked.length < users.length) {
        selectAllCheckRef.current.indeterminate = true;
        selectAllCheckRef.current.checked = false;
      }
      if (userChecked.length === users.length) {
        selectAllCheckRef.current.checked = true;
      }
      if (userChecked.length === 0) {
        selectAllCheckRef.current.checked = false;
      }
    }
  }, [userChecked]);
  return (
    <main>
      <h1>Directorio de usuarios</h1>
      <div className="toolbar flex justify-between">
        <span className="muted">{userChecked.length} seleccionados</span>
        {userChecked.length > 0 && (
          <button type="button" onClick={removeChecked}>
            Borrar Seleccionados
          </button>
        )}
      </div>
      <div>
        <input
          type="checkbox"
          ref={selectAllCheckRef}
          onChange={handleCheckAll}
        />
      </div>
      <ul>
        {users.map((user, i) => (
          <li key={user.id}>
            <label className="flex w-full">
              <input
                type="checkbox"
                id={`${user.id}`}
                ref={(e) => {
                  checkedRef.current[i] = e;
                }}
                onChange={(e) => handleCheckChange(e, user.id)}
              />

              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <button className="remove" onClick={() => handleRemove(user.id)}>
                Borrar
              </button>
            </label>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
