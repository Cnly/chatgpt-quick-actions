import { Action, ActionPanel, Form, getPreferenceValues, getSelectedText } from "@raycast/api";
import { useEffect, useState } from "react";
import ResultView from "./common";

const prefs = getPreferenceValues();
const model_override = prefs.model_ask;
const sys_prompt = prefs.ask_sys_prompt;
const default_question = prefs.ask_default_question;
const toast_title = "Thinking...";

export default function AskView() {
  const [question, setQuestion] = useState("");
  const [questionError, setQuestionError] = useState<string | undefined>();
  const [selectedText, setSelectedText] = useState<string | undefined>();
  const [canUseContext, setCanUseContext] = useState<boolean | undefined>();
  const [usingContext, setUsingContext] = useState<boolean>(false);

  function dropQuestionErrorIfNeeded() {
    if (questionError?.length ?? 0 > 0) {
      setQuestionError(undefined);
    }
  }

  function setQuestionErrorIfNeeded() {
    if (question.length === 0 && !usingContext) {
      setQuestionError("Question is empty!");
    }
  }

  useEffect(() => {
    (async () => {
      try {
        let selectedText: string | undefined = await getSelectedText();
        if (selectedText.length === 0) {
          // Sometimes the call will return successfully but the text is "". In
          // this case we'll just let ResultView retry getting the selected
          // text later.
          selectedText = undefined;
        }
        setSelectedText(selectedText);
        setCanUseContext(true);
        setUsingContext(true);
      } catch (error) {
        // Pass an empty string so ResultView won't try getting selected text
        setCanUseContext(false);
      }
    })();
  }, []);

  useEffect(() => {
    console.log("usingContext changed to", usingContext);
    setQuestionErrorIfNeeded();
  }, [usingContext]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.Push
            title="Submit"
            target={
              <ResultView
                sys_prompt={sys_prompt}
                selected_text={usingContext ? selectedText : ''}
                user_extra_msg={question ? question : default_question}
                model_override={model_override}
                toast_title={toast_title}
              />
            }
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="question"
        title="Question"
        enableMarkdown
        placeholder={
          usingContext &&
          (default_question + ' ') // Raycast will append ellipsis
          || undefined
        }
        value={question}
        error={questionError}
        onChange={(newValue) => {
          setQuestion(newValue);
          dropQuestionErrorIfNeeded();
        }}
        onBlur={setQuestionErrorIfNeeded}
      />
      {
        canUseContext === true ? (
          <Form.Checkbox
            id="use_selected_text"
            title="Context"
            label="Use selected text"
            value={usingContext}
            onChange={setUsingContext}
          />
        ) : (
          <Form.Description
            title="Context"
            text={
              canUseContext === false ? 'No selected text' : 'Getting selected text...'
            }
          />
        )
      }
    </Form>
  );
}
