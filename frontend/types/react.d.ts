// Type definitions for React
// This is a workaround to fix "Cannot find module 'react'" errors

declare module "react" {
  export * from "react/index";
}

declare module "react/jsx-runtime" {
  export * from "react/jsx-runtime/index";
}

declare module "react-dom" {
  export * from "react-dom/index";
}

declare module "@monaco-editor/react" {
  import { editor } from "monaco-editor";
  import * as React from "react";

  export interface EditorProps {
    height?: string | number;
    width?: string | number;
    value?: string;
    defaultValue?: string;
    language?: string;
    theme?: string;
    options?: editor.IStandaloneEditorConstructionOptions;
    overrideServices?: editor.IEditorOverrideServices;
    onChange?: (
      value: string | undefined,
      event: editor.IModelContentChangedEvent
    ) => void;
    onMount?: (
      editor: editor.IStandaloneCodeEditor,
      monaco: typeof editor
    ) => void;
    beforeMount?: (monaco: typeof editor) => void;
    onValidate?: (markers: editor.IMarker[]) => void;
    loading?: React.ReactNode;
    className?: string;
    wrapperClassName?: string;
  }

  export default function Editor(props: EditorProps): React.ReactElement;
}
