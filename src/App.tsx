import "./App.css";
import { Search } from "@mynaui/icons-react";
export default function App() {
  return (
    <div className="h-full w-full flex py-2 px-16">
      <div className="w-full h-full bg-slate-300/50 border-4 border-neutral-50/10 rounded-md flex flex-col gap-2">
        <div className={"flex flex-row gap-2 items-center m-2"}>
          <span>
            <Search />
          </span>
          <input
            className="flex-1 outline-none text-lg"
            type="text"
            placeholder="search"
          />
        </div>
        <div className="flex flex-col p-2 gap-2">
          {Array.from({ length: 17 }, (_, index) => (
            <div className="flex flex-col gap-1 h-10 bg-slate-50 w-full p-1" key={index}>Item {index + 1}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
