import { useState, useId, type InputHTMLAttributes, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', value, defaultValue, ...props }, ref) => {
    const id = useId()
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(Boolean(value || defaultValue))

    const isFloating = isFocused || hasValue

    return (
      <div className={`relative ${className}`}>
        {/* Input field */}
        <input
          ref={ref}
          id={id}
          value={value}
          defaultValue={defaultValue}
          className={`
            w-full bg-transparent
            text-white text-body-large font-medium
            border-b-2 transition-colors duration-base ease-smooth
            outline-none pt-6 pb-2
            ${error
              ? 'border-error'
              : isFocused
              ? 'border-sunrise-400'
              : 'border-obsidian-700'
            }
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false)
            setHasValue(Boolean(e.target.value))
          }}
          onChange={(e) => {
            setHasValue(Boolean(e.target.value))
            props.onChange?.(e)
          }}
          {...props}
        />

        {/* Floating label */}
        <motion.label
          htmlFor={id}
          className={`
            absolute left-0 pointer-events-none
            transition-colors duration-base
            ${error
              ? 'text-error'
              : isFocused
              ? 'text-sunrise-400'
              : 'text-obsidian-500'
            }
          `}
          initial={false}
          animate={{
            y: isFloating ? 0 : 20,
            scale: isFloating ? 0.75 : 1,
            originX: 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
        >
          {label}
        </motion.label>

        {/* Focus line animation */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-sunrise-400"
          initial={{ width: '0%' }}
          animate={{ width: isFocused ? '100%' : '0%' }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Error or hint text */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-footnote text-error mt-2"
            >
              {error}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="text-footnote text-obsidian-400 mt-2"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
)

Input.displayName = 'Input'
