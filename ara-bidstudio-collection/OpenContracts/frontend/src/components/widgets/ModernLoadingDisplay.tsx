import React from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Folder,
  Lock,
  Database,
  BookOpen,
  Archive,
} from "lucide-react";
import { color } from "../../theme/colors";
import osLegalLogo from "../../assets/images/os_legal_FullColor.png";

interface ModernLoadingDisplayProps {
  type?: "document" | "corpus" | "extract" | "auth" | "default";
  message?: string;
  fullScreen?: boolean;
  size?: "small" | "medium" | "large";
}

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const Container = styled(motion.div)<{ $fullScreen?: boolean; $size?: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${(props) => (props.$size === "small" ? "2rem" : "3rem")};
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  ${(props) =>
    props.$fullScreen &&
    `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    transform: none;
    background: linear-gradient(135deg, ${color.N2} 0%, ${color.B1} 100%);
    backdrop-filter: blur(12px);
  `}
`;

const IconContainer = styled(motion.div)<{ $type?: string }>`
  position: relative;
  width: 100px;
  height: 100px;
  margin-bottom: 2rem;

  &::before {
    content: "";
    position: absolute;
    inset: -30px;
    background: linear-gradient(135deg, #ff6b6b 0%, #e74c3c 50%, #c0392b 100%);
    border-radius: 50%;
    opacity: 0.12;
    animation: ${pulse} 2.5s ease-in-out infinite;
    filter: blur(25px);
  }
`;

const IconWrapper = styled(motion.div)<{ $type?: string }>`
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${color.white};
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(231, 76, 60, 0.15),
    0 3px 12px rgba(231, 76, 60, 0.08);
  animation: ${float} 3s ease-in-out infinite;
  border: 1px solid rgba(231, 76, 60, 0.1);
  overflow: hidden;

  img {
    width: 72px;
    height: 72px;
    object-fit: contain;
  }

  svg {
    width: 36px;
    height: 36px;
    color: #e74c3c;
  }
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 1rem;
`;

const Dot = styled(motion.div)<{ $delay: number }>`
  width: 6px;
  height: 6px;
  background: #e74c3c;
  border-radius: 50%;
  animation: ${pulse} 1.4s ease-in-out infinite;
  animation-delay: ${(props) => props.$delay}s;
`;

const Message = styled(motion.h3)`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${color.N10};
  margin: 0;
  margin-top: 0.5rem;
  text-align: center;
  letter-spacing: -0.01em;
`;

const SubMessage = styled(motion.p)`
  font-size: 0.875rem;
  color: ${color.N7};
  margin-top: 0.5rem;
  text-align: center;
  letter-spacing: 0.01em;
`;

const ProgressBar = styled(motion.div)`
  width: 200px;
  height: 3px;
  background: ${color.N3};
  border-radius: 100px;
  overflow: hidden;
  margin-top: 1.5rem;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, transparent, #e74c3c, transparent);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
`;

const getIcon = (type?: string, useOsLogo: boolean = true) => {
  if (useOsLogo) {
    return <img src={osLegalLogo} alt="OpenContracts" />;
  }

  switch (type) {
    case "document":
      return <FileText />;
    case "corpus":
      return <Archive />;
    case "extract":
      return <Database />;
    case "auth":
      return <Lock />;
    default:
      return <Database />;
  }
};

const getMessage = (type?: string, customMessage?: string) => {
  if (customMessage) return customMessage;

  switch (type) {
    case "document":
      return "Opening Document";
    case "corpus":
      return "Loading Corpus";
    case "extract":
      return "Loading Extract";
    case "auth":
      return "Securing Your Session";
    default:
      return "Loading OpenContracts";
  }
};

const getSubMessage = (type?: string) => {
  switch (type) {
    case "document":
      return "Retrieving document and annotations";
    case "corpus":
      return "Organizing your document collection";
    case "extract":
      return "Loading extracted data";
    case "auth":
      return "Verifying credentials";
    default:
      return "Preparing your workspace";
  }
};

export const ModernLoadingDisplay: React.FC<ModernLoadingDisplayProps> = ({
  type = "default",
  message,
  fullScreen = false,
  size = "medium",
}) => {
  return (
    <AnimatePresence>
      <Container
        $fullScreen={fullScreen}
        $size={size}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <IconContainer $type={type}>
          <IconWrapper
            $type={type}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
          >
            {getIcon(type)}
          </IconWrapper>
        </IconContainer>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Message>{getMessage(type, message)}</Message>
          <SubMessage>{getSubMessage(type)}</SubMessage>
        </motion.div>

        <ProgressBar
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.3 }}
        >
          <ProgressFill />
        </ProgressBar>

        <LoadingDots>
          <Dot $delay={0} />
          <Dot $delay={0.2} />
          <Dot $delay={0.4} />
        </LoadingDots>
      </Container>
    </AnimatePresence>
  );
};

export const SkeletonLoader = styled.div<{ $height?: string; $width?: string }>`
  height: ${(props) => props.$height || "20px"};
  width: ${(props) => props.$width || "100%"};
  background: linear-gradient(
    90deg,
    ${color.N3} 25%,
    ${color.N4} 50%,
    ${color.N3} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 4px;
  margin: 8px 0;
`;

export const CardSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    style={{
      padding: "1.5rem",
      background: color.white,
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
      margin: "1rem",
      border: `1px solid ${color.N3}`,
    }}
  >
    <SkeletonLoader $height="24px" $width="60%" />
    <SkeletonLoader $height="16px" $width="100%" />
    <SkeletonLoader $height="16px" $width="90%" />
    <SkeletonLoader $height="16px" $width="95%" />
    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
      <SkeletonLoader $height="32px" $width="80px" />
      <SkeletonLoader $height="32px" $width="80px" />
    </div>
  </motion.div>
);

export const DocumentCardSkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    style={{
      padding: "1.5rem",
      background: color.white,
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
      margin: "1rem",
      border: `1px solid ${color.N3}`,
      display: "flex",
      gap: "1rem",
    }}
  >
    <div style={{ width: "48px", height: "48px", flexShrink: 0 }}>
      <SkeletonLoader $height="48px" $width="48px" />
    </div>
    <div style={{ flex: 1 }}>
      <SkeletonLoader $height="20px" $width="70%" />
      <SkeletonLoader $height="14px" $width="100%" />
      <SkeletonLoader $height="14px" $width="90%" />
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <SkeletonLoader $height="20px" $width="60px" />
        <SkeletonLoader $height="20px" $width="80px" />
        <SkeletonLoader $height="20px" $width="70px" />
      </div>
    </div>
  </motion.div>
);
