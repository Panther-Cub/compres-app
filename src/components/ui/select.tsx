import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

export interface SelectProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  value?: string | number;
  onChange?: (e: { target: { value: string } }) => void;
  children: React.ReactNode;
}

export interface SelectOptionProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number;
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ className, children, value, onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState<boolean>(false);
    const [selectedValue, setSelectedValue] = React.useState<string | undefined>(value?.toString());
    const selectRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      setSelectedValue(value?.toString());
    }, [value]);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent): void => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (newValue: string): void => {
      setSelectedValue(newValue);
      setIsOpen(false);
      if (onChange) {
        onChange({ target: { value: newValue } });
      }
    };

    const selectedOption = React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && child.props.value === selectedValue
    ) as React.ReactElement<SelectOptionProps> | undefined;

    return (
      <div className="relative" ref={selectRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-full border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-accent hover:text-accent-foreground",
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
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-full border border-border bg-background shadow-sm">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return (
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
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  }
);
Select.displayName = "Select"

const SelectOption = React.forwardRef<HTMLDivElement, SelectOptionProps>(
  ({ className, children, value, ...props }, ref) => (
    <div
      className={cn("", className)}
      ref={ref}
      data-value={value}
      {...props}
    >
      {children}
    </div>
  )
);
SelectOption.displayName = "SelectOption"

export { Select, SelectOption }
