// components/ui/AnimatedContent.tsx
import React from 'react';

const AnimatedContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="animate-fade-in">
            {children}
        </div>
    );
};

// Add the animation to the global stylesheet via a style tag
const styles = `
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
}
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);


export default AnimatedContent;
