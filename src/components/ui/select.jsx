import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

const Select = React.forwardRef(({ className, children, value, onChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value);
  const selectRef = React.useRef(null);

  React.useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newValue) => {
    setSelectedValue(newValue);
    setIsOpen(false);
    if (onChange) {
      onChange({ target: { value: newValue } });
    }
  };

  const selectedOption = React.Children.toArray(children).find(
    child => child.props.value === selectedValue
  );

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-accent hover:text-accent-foreground",
          className
        )}
        ref={ref}
        {...props}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.props.children : 'Select option'}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 opacity-50 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-background shadow-lg">
          {React.Children.map(children, (child) => (
            <button
              key={child.props.value}
              type="button"
              onClick={() => handleSelect(child.props.value)}
              className={cn(
                "flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                child.props.value === selectedValue && "bg-accent text-accent-foreground"
              )}
            >
              {child.props.children}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
Select.displayName = "Select"

const SelectOption = React.forwardRef(({ className, children, value, ...props }, ref) => (
  <div
    className={cn("", className)}
    ref={ref}
    data-value={value}
    {...props}
  >
    {children}
  </div>
))
SelectOption.displayName = "SelectOption"

export { Select, SelectOption }
