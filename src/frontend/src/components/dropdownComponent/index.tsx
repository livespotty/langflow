import { PopoverAnchor } from "@radix-ui/react-popover";
import Fuse from "fuse.js";
import { cloneDeep } from "lodash";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { DropDownComponentType } from "../../types/components";
import { cn } from "../../utils/utils";
import { default as ForwardedIconComponent } from "../genericIconComponent";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverContentWithoutPortal,
  PopoverTrigger,
} from "../ui/popover";

export default function Dropdown({
  disabled,
  isLoading,
  value,
  options,
  combobox,
  onSelect,
  editNode = false,
  id = "",
  children,
}: DropDownComponentType): JSX.Element {
  const [open, setOpen] = useState(children ? true : false);

  const refButton = useRef<HTMLButtonElement>(null);

  const PopoverContentDropdown =
    children || editNode ? PopoverContent : PopoverContentWithoutPortal;

  const [customValue, setCustomValue] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);

  const fuse = new Fuse(options, { keys: ["name", "value"] });

  const searchRoleByTerm = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const searchValues = fuse.search(value);
    const filtered = searchValues.map((search) => search.item);
    if (!filtered.includes(value) && combobox) filtered.push(value);
    setFilteredOptions(value ? filtered : options);
    setCustomValue(value);
  };

  useEffect(() => {
    if (open) {
      const filtered = cloneDeep(options);
      if (customValue === value && combobox) {
        filtered.push(customValue);
      }
      setFilteredOptions(filtered);
    }
  }, [open]);

  return (
    <>
      {Object.keys(options ?? [])?.length > 0 ? (
        <>
          <Popover open={open} onOpenChange={children ? () => {} : setOpen}>
            {children ? (
              <PopoverAnchor>{children}</PopoverAnchor>
            ) : (
              <PopoverTrigger asChild>
                <Button
                  disabled={disabled}
                  variant="primary"
                  size="xs"
                  role="combobox"
                  ref={refButton}
                  aria-expanded={open}
                  data-testid={`${id ?? ""}`}
                  className={cn(
                    editNode
                      ? "dropdown-component-outline"
                      : "dropdown-component-false-outline",
                    "w-full justify-between font-normal",
                    editNode ? "input-edit-node" : "py-2",
                  )}
                >
                  <span
                    className="truncate"
                    data-testid={`value-dropdown-` + id}
                  >
                    {value &&
                    value !== "" &&
                    filteredOptions.find((option) => option === value)
                      ? filteredOptions.find((option) => option === value)
                      : "Choose an option..."}
                  </span>

                  <ForwardedIconComponent
                    name="ChevronsUpDown"
                    className="ml-2 h-4 w-4 shrink-0 opacity-50"
                  />
                </Button>
              </PopoverTrigger>
            )}
            <PopoverContentDropdown
              side="bottom"
              avoidCollisions={!!children}
              className="noflow nowheel nopan nodelete nodrag p-0"
              style={
                children
                  ? {}
                  : { minWidth: refButton?.current?.clientWidth ?? "200px" }
              }
            >
              <Command>
                <div className="flex items-center border-b px-3">
                  <ForwardedIconComponent
                    name="search"
                    className="mr-2 h-4 w-4 shrink-0 opacity-50"
                  />
                  <input
                    onChange={searchRoleByTerm}
                    placeholder="Search options..."
                    className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <CommandList>
                  <CommandEmpty>No values found.</CommandEmpty>
                  <CommandGroup defaultChecked={false}>
                    {filteredOptions?.map((option, id) => (
                      <CommandItem
                        key={id}
                        value={option}
                        onSelect={(currentValue) => {
                          onSelect(currentValue);
                          setOpen(false);
                        }}
                        className="items-center truncate"
                        data-testid={`${option}-${id ?? ""}-option`}
                      >
                        {customValue === option ? (
                          <span className="text-muted-foreground">
                            Text:&nbsp;
                          </span>
                        ) : (
                          <></>
                        )}
                        {option}
                        <ForwardedIconComponent
                          name="Check"
                          className={cn(
                            "ml-auto h-4 w-4 text-primary",
                            value === option ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContentDropdown>
          </Popover>
        </>
      ) : (
        <>
          {(!isLoading && (
            <div>
              <span className="text-sm italic">
                No parameters are available for display.
              </span>
            </div>
          )) || (
            <div>
              <span className="text-sm italic">Loading...</span>
            </div>
          )}
        </>
      )}
    </>
  );
}
