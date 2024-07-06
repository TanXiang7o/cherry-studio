import { EVENT_NAMES, EventEmitter } from '@renderer/services/event'
import { Assistant, Message, Topic } from '@renderer/types'
import { uuid } from '@renderer/utils'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { MoreOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Tooltip } from 'antd'
import { useShowRightSidebar } from '@renderer/hooks/useStore'
import { useAssistant } from '@renderer/hooks/useAssistant'
import { ClearOutlined, HistoryOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { TextAreaRef } from 'antd/es/input/TextArea'
import { isEmpty } from 'lodash'
import SendMessageSetting from './SendMessageSetting'
import { useSettings } from '@renderer/hooks/useSettings'

interface Props {
  assistant: Assistant
  setActiveTopic: (topic: Topic) => void
}

const Inputbar: FC<Props> = ({ assistant, setActiveTopic }) => {
  const [text, setText] = useState('')
  const { setShowRightSidebar } = useShowRightSidebar()
  const { addTopic } = useAssistant(assistant.id)
  const { sendMessageShortcut } = useSettings()
  const inputRef = useRef<TextAreaRef>(null)

  const sendMessage = () => {
    if (isEmpty(text.trim())) {
      return
    }

    const message: Message = {
      id: uuid(),
      role: 'user',
      content: text,
      assistantId: assistant.id,
      topicId: assistant.topics[0].id || uuid(),
      createdAt: 'now'
    }

    EventEmitter.emit(EVENT_NAMES.SEND_MESSAGE, message)

    setText('')
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (sendMessageShortcut === 'Enter' && event.key === 'Enter') {
      if (event.shiftKey) {
        return
      }
      sendMessage()
      return event.preventDefault()
    }

    if (sendMessageShortcut === 'Shift+Enter' && event.key === 'Enter' && event.shiftKey) {
      sendMessage()
      return event.preventDefault()
    }
  }

  const addNewTopic = useCallback(() => {
    const topic: Topic = {
      id: uuid(),
      name: 'Default Topic',
      messages: []
    }
    addTopic(topic)
    setActiveTopic(topic)
  }, [addTopic, setActiveTopic])

  const clearTopic = () => {
    EventEmitter.emit(EVENT_NAMES.CLEAR_MESSAGES)
  }

  // Command or Ctrl + N create new topic
  useEffect(() => {
    const onKeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        addNewTopic()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  }, [addNewTopic])

  useEffect(() => {
    inputRef.current?.focus()
  }, [assistant])

  return (
    <Container>
      <Toolbar>
        <ToolbarMenu>
          <Tooltip placement="top" title=" New Chat " arrow>
            <ToolbarButton type="text" onClick={addNewTopic}>
              <PlusCircleOutlined />
            </ToolbarButton>
          </Tooltip>
          <Tooltip placement="top" title=" Topics " arrow>
            <ToolbarButton type="text" onClick={setShowRightSidebar}>
              <HistoryOutlined />
            </ToolbarButton>
          </Tooltip>
          <Tooltip placement="top" title=" Clear " arrow>
            <Popconfirm
              icon={false}
              title="Clear all messages?"
              description="Are you sure to clear all messages?"
              placement="top"
              onConfirm={clearTopic}
              okText="Clear"
              cancelText="Cancel">
              <ToolbarButton type="text">
                <ClearOutlined />
              </ToolbarButton>
            </Popconfirm>
          </Tooltip>
        </ToolbarMenu>
        <ToolbarMenu>
          <SendMessageSetting>
            <ToolbarButton type="text" style={{ marginRight: 0 }}>
              <MoreOutlined />
            </ToolbarButton>
          </SendMessageSetting>
        </ToolbarMenu>
      </Toolbar>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message here..."
        autoFocus
        contextMenu="true"
        ref={inputRef}
      />
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: var(--input-bar-height);
  border-top: 0.5px solid var(--color-border);
  padding: 5px 15px;
`

const Textarea = styled.textarea`
  display: flex;
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 13px;
  line-height: 18px;
  color: var(--color-text);
  background-color: transparent;
`

const Toolbar = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 0 -5px;
  margin-bottom: 5px;
`

const ToolbarMenu = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const ToolbarButton = styled(Button)`
  width: 32px;
  height: 32px;
  font-size: 18px;
  border-radius: 50%;
  transition: all 0.3s ease;
  margin-right: 6px;
  color: var(--color-icon);
  &.anticon {
    transition: all 0.3s ease;
    color: var(--color-icon);
  }
  &:hover {
    background-color: var(--color-background-soft);
    .anticon {
      color: white;
    }
  }
`

export default Inputbar