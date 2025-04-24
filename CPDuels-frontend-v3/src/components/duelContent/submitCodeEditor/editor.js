import React, { useEffect, useRef } from "react";
import AceEditor from "react-ace";
import { useColorModeValue } from "@chakra-ui/react";
import languages, { codes_to_languages } from "./languages";

import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-csharp";
import "ace-builds/src-noconflict/mode-d";
import "ace-builds/src-noconflict/mode-golang";
import "ace-builds/src-noconflict/mode-haskell";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-kotlin";
import "ace-builds/src-noconflict/mode-ocaml";
import "ace-builds/src-noconflict/mode-pascal";
import "ace-builds/src-noconflict/mode-perl";
import "ace-builds/src-noconflict/mode-php";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-ruby";
import "ace-builds/src-noconflict/mode-rust";
import "ace-builds/src-noconflict/mode-scala";
import "ace-builds/src-noconflict/mode-scheme";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/mode-erlang";
import "ace-builds/src-noconflict/mode-elixir";

import "ace-builds/src-noconflict/theme-iplastic";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import { MdTurnedIn } from "react-icons/md";

const Editor = ({
  duelPlatform,
  languageCode,
  onSetCode,
  providedValue,
  readOnly,
}) => {
  const theme = useColorModeValue("iplastic", "monokai");

  function onChange(newValue) {
    onSetCode(newValue);
  }

  const platform =
    duelPlatform && duelPlatform in languages ? duelPlatform : "CF";
  const selection =
    languageCode && languageCode in codes_to_languages[platform]
      ? languages[platform][codes_to_languages[platform][languageCode]]
      : languages[platform][languages.defaults[platform]];

  const editorRef = useRef();
  useEffect(() => {
    if (providedValue && editorRef.current) {
      editorRef.current.setValue(providedValue);
    }
  }, [providedValue]);

  return (
    <AceEditor
      onLoad={
        (editor) => {
          editorRef.current = editor.session;
        }
      }
      mode={selection}
      theme={theme}
      onChange={readOnly ? () => {} : onChange}
      readOnly={readOnly ? readOnly : false}
      name="editor"
      width="100%"
      height="400px"
      fontSize={14}
      showPrintMargin={true}
      showGutter={true}
      highlightActiveLine={true}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showLineNumbers: true,
        tabSize: 4,
      }}
    />
  );
};

export default Editor;
