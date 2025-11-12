import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { cn } from '../../utils/cn';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animation?: 'bounce' | 'pulse' | 'shake' | 'glow' | 'ripple' | 'magnetic' | 'morph';
  loading?: boolean;
  success?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  hapticFeedback?: boolean;
  soundEffect?: 'click' | 'success' | 'error' | 'notification';
  children: React.ReactNode;
}

const variants = {
  primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl',
  secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 hover:from-gray-200 hover:to-gray-300',
  danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl',
  success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl',
  outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white',
  ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

const animations = {
  bounce: {
    whileHover: { scale: 1.05, y: -2 },
    whileTap: { scale: 0.95, y: 0 },
    transition: { type: 'spring', stiffness: 400, damping: 17 }
  },
  pulse: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    animate: { boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0.7)', '0 0 0 10px rgba(59, 130, 246, 0)'] },
    transition: { duration: 1.5, repeat: Infinity }
  },
  shake: {
    whileHover: { x: [0, -2, 2, -2, 2, 0], transition: { duration: 0.5 } },
    whileTap: { scale: 0.95 }
  },
  glow: {
    whileHover: { 
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)',
      scale: 1.02
    },
    whileTap: { scale: 0.98 }
  },
  ripple: {
    whileTap: { scale: 0.95 }
  },
  magnetic: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 }
  },
  morph: {
    whileHover: { 
      borderRadius: ['8px', '20px', '8px'],
      transition: { duration: 0.6, repeat: Infinity }
    },
    whileTap: { scale: 0.95 }
  }
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  animation = 'bounce',
  loading = false,
  success = false,
  icon,
  iconPosition = 'left',
  hapticFeedback = false,
  soundEffect,
  className,
  children,
  onClick,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const controls = useAnimation();

  // Efeito de som
  const playSound = (sound: string) => {
    if (!soundEffect) return;
    
    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Fallback para navegadores que não suportam autoplay
      console.log('Sound not available');
    });
  };

  // Feedback háptico
  const triggerHapticFeedback = () => {
    if (!hapticFeedback || !navigator.vibrate) return;
    navigator.vibrate(50);
  };

  // Efeito ripple
  const handleRipple = (e: React.MouseEvent) => {
    if (animation !== 'ripple') return;

    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRipplePosition({ x, y });
    setShowRipple(true);

    setTimeout(() => setShowRipple(false), 600);
  };

  // Efeito magnético
  const handleMouseMove = (e: React.MouseEvent) => {
    if (animation !== 'magnetic' || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * 0.1;
    const deltaY = (e.clientY - centerY) * 0.1;

    controls.start({
      x: deltaX,
      y: deltaY,
      transition: { type: 'spring', stiffness: 150, damping: 15 }
    });
  };

  const handleMouseLeave = () => {
    if (animation === 'magnetic') {
      controls.start({
        x: 0,
        y: 0,
        transition: { type: 'spring', stiffness: 150, damping: 15 }
      });
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    handleRipple(e);
    triggerHapticFeedback();
    
    if (soundEffect) {
      playSound(success ? 'success' : soundEffect);
    }

    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);

    onClick?.(e);
  };

  const animationProps = animations[animation];

  return (
    <motion.button
      ref={buttonRef}
      className={cn(
        'relative overflow-hidden font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        isPressed && 'transform scale-95',
        className
      )}
      animate={controls}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      {...animationProps}
      {...props}
    >
      {/* Ripple Effect */}
      <AnimatePresence>
        {showRipple && animation === 'ripple' && (
          <motion.div
            className="absolute rounded-full bg-white opacity-30"
            style={{
              left: ripplePosition.x - 50,
              top: ripplePosition.y - 50,
              width: 100,
              height: 100,
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* Conteúdo do botão */}
      <div className="relative flex items-center justify-center space-x-2">
        {/* Loading spinner */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success checkmark */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conteúdo normal */}
        <motion.div
          className={cn(
            'flex items-center space-x-2',
            (loading || success) && 'opacity-0'
          )}
          animate={{ opacity: (loading || success) ? 0 : 1 }}
        >
          {icon && iconPosition === 'left' && (
            <motion.span
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {icon}
            </motion.span>
          )}
          
          <motion.span
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {children}
          </motion.span>
          
          {icon && iconPosition === 'right' && (
            <motion.span
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {icon}
            </motion.span>
          )}
        </motion.div>
      </div>

      {/* Glow effect */}
      {animation === 'glow' && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 hover:opacity-20 transition-opacity duration-300 -z-10 blur-xl" />
      )}
    </motion.button>
  );
};
