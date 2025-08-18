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
            "flex h-9 w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:bg-accent/30 bg-accent/10 backdrop-blur-sm",
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
          <div className="select-dropdown absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-card shadow-lg">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return (
                  <button
                    key={child.props.value}
                    type="button"
                    onClick={() => handleSelect(child.props.value)}
                    className={cn(
                      "flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-primary hover:text-primary-foreground first:rounded-t-md last:rounded-b-md",
                      child.props.value === selectedValue && "bg-primary text-primary-foreground"
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
