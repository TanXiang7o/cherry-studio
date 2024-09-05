import { DeleteOutlined, EditOutlined, OpenAIOutlined } from '@ant-design/icons'
import DragableList from '@renderer/components/DragableList'
import PromptPopup from '@renderer/components/Popups/PromptPopup'
import { useAssistant } from '@renderer/hooks/useAssistant'
import { useSettings } from '@renderer/hooks/useSettings'
import { fetchMessagesSummary } from '@renderer/services/api'
import LocalStorage from '@renderer/services/storage'
import { useAppSelector } from '@renderer/store'
import { Assistant, Topic } from '@renderer/types'
import { Dropdown, MenuProps } from 'antd'
import { FC, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  assistant: Assistant
  activeTopic: Topic
  setActiveTopic: (topic: Topic) => void
}

const Topics: FC<Props> = ({ assistant: _assistant, activeTopic, setActiveTopic }) => {
  const { assistant, removeTopic, updateTopic, updateTopics } = useAssistant(_assistant.id)
  const { t } = useTranslation()
  const generating = useAppSelector((state) => state.runtime.generating)
  const { topicPosition } = useSettings()

  const borderStyle = '0.5px solid var(--color-border)'

  const getTopicMenuItems = useCallback(
    (topic: Topic) => {
      const menus: MenuProps['items'] = [
        {
          label: t('chat.topics.auto_rename'),
          key: 'auto-rename',
          icon: <OpenAIOutlined />,
          async onClick() {
            const messages = await LocalStorage.getTopicMessages(topic.id)
            if (messages.length >= 2) {
              const summaryText = await fetchMessagesSummary({ messages, assistant })
              if (summaryText) {
                updateTopic({ ...topic, name: summaryText })
              }
            }
          }
        },
        {
          label: t('chat.topics.edit.title'),
          key: 'rename',
          icon: <EditOutlined />,
          async onClick() {
            const name = await PromptPopup.show({
              title: t('chat.topics.edit.title'),
              message: '',
              defaultValue: topic?.name || ''
            })
            if (name && topic?.name !== name) {
              updateTopic({ ...topic, name })
            }
          }
        }
      ]

      if (assistant.topics.length > 1) {
        menus.push({ type: 'divider' })
        menus.push({
          label: t('common.delete'),
          danger: true,
          key: 'delete',
          icon: <DeleteOutlined />,
          onClick() {
            if (assistant.topics.length === 1) return
            removeTopic(topic)
            setActiveTopic(assistant.topics[0])
          }
        })
      }

      return menus
    },
    [assistant, removeTopic, setActiveTopic, t, updateTopic]
  )

  const onSwitchTopic = useCallback(
    (topic: Topic) => {
      if (generating) {
        window.message.warning({ content: t('message.switch.disabled'), key: 'switch-assistant' })
        return
      }
      setActiveTopic(topic)
    },
    [generating, setActiveTopic, t]
  )

  return (
    <Container style={topicPosition === 'left' ? { borderRight: borderStyle } : { borderLeft: borderStyle }}>
      <DragableList list={assistant.topics} onUpdate={updateTopics}>
        {(topic) => {
          const isActive = topic.id === activeTopic?.id
          const activeClass = topicPosition === 'left' ? 'active-left' : 'active-right'
          return (
            <Dropdown menu={{ items: getTopicMenuItems(topic) }} trigger={['contextMenu']} key={topic.id}>
              <TopicListItem className={isActive ? activeClass : ''} onClick={() => onSwitchTopic(topic)}>
                {topic.name}
              </TopicListItem>
            </Dropdown>
          )
        }}
      </DragableList>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-top: 10px;
  min-width: var(--topic-list-width);
  max-width: var(--topic-list-width);
  border-right: 0.5px solid var(--color-border);
  border-left: 0.5px solid var(--color-border);
  overflow-y: scroll;
  height: calc(100vh - var(--navbar-height));
`

const TopicListItem = styled.div`
  padding: 7px 10px;
  margin: 0 10px;
  cursor: pointer;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: Ubuntu;
  font-size: 13px;
  &:hover {
    background-color: var(--color-background-soft);
  }
  &.active-left {
    background-color: var(--color-primary);
    color: white;
    font-weight: 500;
  }
  &.active-right {
    background-color: var(--color-background-mute);
    font-weight: 500;
  }
`

export default Topics