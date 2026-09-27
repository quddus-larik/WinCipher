import { useState, useRef } from "react";
import "./App.css";
import { Search } from "@mynaui/icons-react";
import { SearchField, Kbd, Separator, Button } from "@heroui/react";

export default function App() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef([]);
  const itemCount = 8;

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % itemCount);
      itemRefs.current[(selectedIndex + 1) % itemCount]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + itemCount) % itemCount);
      itemRefs.current[(selectedIndex - 1 + itemCount) % itemCount]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSelectedIndex(-1);
      document.activeElement?.blur();
    }
  };

  return (
    <div className="h-full w-full flex py-2 px-16" onKeyDown={handleKeyDown}>
      <div className="w-full h-full bg-background/80 border-4 border-background-secondary/10 rounded-md flex flex-col gap-2">
        <div className="flex flex-row gap-2 items-center mx-2 mt-2">
          <SearchField name="search" className="w-full bg-transparent">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search..." />
              <Kbd className="m-1.5">Esc</Kbd>
            </SearchField.Group>
          </SearchField>
        </div>
        <Separator />
        <div className="flex flex-col px-2 gap-2" role="listbox">
          {Array.from({ length: itemCount }, (_, index) => (
            <Button
              key={index}
              ref={(el) => (itemRefs.current[index] = el)}
              tabIndex={selectedIndex === index ? 0 : -1}
              size="lg"
              onClick={() => setSelectedIndex(index)}
              fullWidth
              variant="tertiary"
              className={"rounded-md"}
            >
              Item {index + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}