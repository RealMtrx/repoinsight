import { Component } from "react";
import { Box, Text } from "ink";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TUIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box flexDirection="column" padding={2}>
          <Text color="#E63946" bold>
            {" "}
            ◐ TUI Error{" "}
          </Text>
          <Box marginTop={1}>
            <Text color="#8D99AE">
              {this.state.error?.message ?? "An unexpected error occurred"}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#6C757D">Press Ctrl+C to exit, then run with --debug for details</Text>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
