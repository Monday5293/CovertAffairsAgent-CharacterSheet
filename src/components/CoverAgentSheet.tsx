import * as React from 'react'
import { useState, useRef } from 'react'
import { CovertAgent } from '../types/character'
import '../styles/CoverAgentSheet.css'

const CovertAgentSheet: React.FC = () => {
  const [agent, setAgent] = useState<CovertAgent>({
    codename: '',
    realName: '',
    age: 0,
    gender: '',
    birthPlace: '',
    experience: 0,
    initialBlackCoin: 0,
    currentIntoxication: 0,
    settledBlackCoin: 0,
    remainingBlackCoin: 0,
    socialAttributes: {
      wealth: 0,
      power: 0,
      prestige: 0,
      network: 0
    },
    avatar: '',
    socialAttributeDescriptions: {
      wealth: '',
      power: '',
      prestige: '',
      network: ''
    },
    alcoholTokens: {
      red: 0,
      yellow: 0,
      blue: 0,
      green: 0
    },
    health: {
      current: 10,
      max: 10,
      stress: 0,
      trauma: []
    },
    equipment: {
      weapons: [],
      gadgets: [],
      documents: [],
      contacts: []
    },
    specialties: [],
    missions: [],
    secrets: {
      coverIdentity: '',
      knownAliases: [],
      weaknesses: [],
      objectives: []
    }
  })

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [showAvatarCropper, setShowAvatarCropper] = useState(false)
  const [tempImageUrl, setTempImageUrl] = useState('')
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 100, height: 150 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const cropperRef = useRef<HTMLDivElement | null>(null)
  const startRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  const [draggingHandle, setDraggingHandle] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const ASPECT_RATIO = 9 / 16
  const MIN_CROP_SIZE = 40

  // 追踪最高醉意值和独立生命值
  const [maxIntoxication, setMaxIntoxication] = useState(0)
  const [currentHealth, setCurrentHealth] = useState(10)

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setTempImageUrl(result)
      setShowAvatarCropper(true)
      // 初始化裁剪框使其填充预览区域
      const img = new Image()
      img.onload = () => {
        const previewWidth = 400
        const previewHeight = 600
        let cropWidth = previewWidth * 0.8
        let cropHeight = cropWidth / ASPECT_RATIO
      
        if (cropHeight > previewHeight * 0.8) {
          cropHeight = previewHeight * 0.8
          cropWidth = cropHeight * ASPECT_RATIO
        }
      
        setCropRect({
          x: (previewWidth - cropWidth) / 2,
          y: (previewHeight - cropHeight) / 2,
          width: cropWidth,
          height: cropHeight
        })
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  }

  const openAvatarDialog = () => {
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const handleCropStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDraggingHandle('move')
    setDragStart({ x: e.clientX, y: e.clientY })
    // store the rect at drag start so moves use the stable starting values
    startRectRef.current = { ...cropRect }
  }

  const handleCropStartHandle = (e: React.MouseEvent, handle: 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault()
    // prevent the parent .crop-box onMouseDown from overriding this as a "move"
    e.stopPropagation()
    setIsDragging(true)
    setDraggingHandle(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
    // store the rect at drag start so resizing calculations are stable
    startRectRef.current = { ...cropRect }
  }

  const handleCropMove = (e: React.MouseEvent) => {
    if (!isDragging || !cropperRef.current) return
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    const container = cropperRef.current.getBoundingClientRect()
    const containerWidth = container.width
    const containerHeight = container.height

    // Use the rect snapshot saved at drag start for stable calculations
    const start = startRectRef.current ?? cropRect

    if (draggingHandle === 'move') {
      const newX = Math.max(0, Math.min(start.x + deltaX, containerWidth - start.width))
      const newY = Math.max(0, Math.min(start.y + deltaY, containerHeight - start.height))
      setCropRect({ ...start, x: newX, y: newY })
    } else if (draggingHandle) {
      let newX = start.x
      let newY = start.y
      let newWidth = start.width
      let newHeight = start.height

      // compute tentative width/height depending on which corner is dragged
      if (draggingHandle === 'nw') {
        newWidth = start.width - deltaX
        newHeight = start.height - deltaY
      } else if (draggingHandle === 'ne') {
        newWidth = start.width + deltaX
        newHeight = start.height - deltaY
      } else if (draggingHandle === 'sw') {
        newWidth = start.width - deltaX
        newHeight = start.height + deltaY
      } else if (draggingHandle === 'se') {
        newWidth = start.width + deltaX
        newHeight = start.height + deltaY
      }

      // enforce aspect ratio by basing height on width
      newWidth = Math.max(MIN_CROP_SIZE, newWidth)
      newHeight = newWidth / ASPECT_RATIO

      // adjust x/y when left/top edges moved
      if (draggingHandle === 'nw') {
        newX = start.x + (start.width - newWidth)
        newY = start.y + (start.height - newHeight)
      } else if (draggingHandle === 'ne') {
        newX = start.x
        newY = start.y + (start.height - newHeight)
      } else if (draggingHandle === 'sw') {
        newX = start.x + (start.width - newWidth)
        newY = start.y
      } else if (draggingHandle === 'se') {
        newX = start.x
        newY = start.y
      }

      // clamp to container bounds
      if (newX < 0) {
        newX = 0
      }
      if (newY < 0) {
        newY = 0
      }
      if (newX + newWidth > containerWidth) {
        newWidth = containerWidth - newX
        newWidth = Math.max(MIN_CROP_SIZE, newWidth)
        newHeight = newWidth / ASPECT_RATIO
      }
      if (newY + newHeight > containerHeight) {
        newHeight = containerHeight - newY
        newHeight = Math.max(MIN_CROP_SIZE / ASPECT_RATIO, newHeight)
        newWidth = newHeight * ASPECT_RATIO
      }

      setCropRect({ x: newX, y: newY, width: newWidth, height: newHeight })
    }
  }

  const handleCropEnd = () => {
    setIsDragging(false)
    setDraggingHandle(null)
  }

  // 酒类展示（6 个方框）
  const [bottles, setBottles] = useState(() =>
    Array.from({ length: 6 }, (_, i) => ({ image: '', name: `酒${i + 1}` }))
  )
  const bottleFileInputRef = useRef<HTMLInputElement | null>(null)
  const [currentBottleIndex, setCurrentBottleIndex] = useState<number | null>(null)

  const openBottleDialog = (index: number) => {
    setCurrentBottleIndex(index)
    if (bottleFileInputRef.current) bottleFileInputRef.current.click()
  }

  const handleBottleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0]
    if (!file || currentBottleIndex === null) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setBottles(prev => {
        const next = [...prev]
        next[currentBottleIndex] = { ...next[currentBottleIndex], image: result }
        return next
      })
      setCurrentBottleIndex(null)
      // clear the input so same file can be reselected later
      if (e.target) e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const confirmCrop = () => {
    if (!tempImageUrl) return
    
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scaleX = img.width / (cropperRef.current?.offsetWidth || 200)
      const scaleY = img.height / (cropperRef.current?.offsetHeight || 300)
      
      canvas.width = cropRect.width * scaleX
      canvas.height = cropRect.height * scaleY
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(
          img,
          cropRect.x * scaleX,
          cropRect.y * scaleY,
          cropRect.width * scaleX,
          cropRect.height * scaleY,
          0,
          0,
          canvas.width,
          canvas.height
        )
      }
      
      setAgent(prev => ({ ...prev, avatar: canvas.toDataURL() }))
      setShowAvatarCropper(false)
      setTempImageUrl('')
    }
    img.src = tempImageUrl
  }

  const cancelCrop = () => {
    setShowAvatarCropper(false)
    setTempImageUrl('')
  }

  const [newSpecialty, setNewSpecialty] = useState('')
  const [newWeapon, setNewWeapon] = useState('')
  const [newGadget, setNewGadget] = useState('')
  const [newContact, setNewContact] = useState('')
  const [newAlias, setNewAlias] = useState('')

  // 社会属性处理函数
  const handleAttributeChange = (attribute: keyof CovertAgent['socialAttributes'], value: number) => {
    setAgent(prev => ({
      ...prev,
      socialAttributes: {
        ...prev.socialAttributes,
        [attribute]: Math.max(0, Math.min(10, value))
      }
    }))
  }


  // 健康状况处理
  const handleHealthChange = (field: keyof CovertAgent['health'], value: number | string[]) => {
    setAgent(prev => ({
      ...prev,
      health: {
        ...prev.health,
        [field]: value
      }
    }))
  }

  // 添加项目函数
  const addItem = <T extends keyof CovertAgent['equipment']>(
    category: T, 
    item: string, 
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (item.trim()) {
      setAgent(prev => ({
        ...prev,
        equipment: {
          ...prev.equipment,
          [category]: [...prev.equipment[category], item.trim()]
        }
      }))
      setter('')
    }
  }

  const addSpecialty = () => {
    if (newSpecialty.trim()) {
      setAgent(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }))
      setNewSpecialty('')
    }
  }

  const addAlias = () => {
    if (newAlias.trim()) {
      setAgent(prev => ({
        ...prev,
        secrets: {
          ...prev.secrets,
          knownAliases: [...prev.secrets.knownAliases, newAlias.trim()]
        }
      }))
      setNewAlias('')
    }
  }

  return (
    <div className="covert-agent-sheet">
      {/* 特工基本信息 */}
      <div className="section agent-info">
        <h2>🕵️ 特工档案</h2>
        <div className="agent-info-wrapper">
          {/* 上层：头像和个人信息左右排列 */}
          <div className="agent-info-top">
            {/* 第一个框：头像 */}
            <div className="agent-info-box avatar-box-container">
              <div className="avatar-column">
                {showAvatarCropper ? (
                  <div className="avatar-cropper-modal">
                    <div className="cropper-container">
                      <div 
                        className="cropper-preview"
                        ref={cropperRef}
                        onMouseMove={handleCropMove}
                        onMouseUp={handleCropEnd}
                        onMouseLeave={handleCropEnd}
                      >
                        <img src={tempImageUrl} alt="crop" className="cropper-image" />
                        <div
                          className="crop-box"
                          style={{
                            left: `${cropRect.x}px`,
                            top: `${cropRect.y}px`,
                            width: `${cropRect.width}px`,
                            height: `${cropRect.height}px`
                          }}
                          onMouseDown={handleCropStart}
                        >
                          <div className="crop-handle crop-handle-nw" onMouseDown={(e) => handleCropStartHandle(e, 'nw')}></div>
                          <div className="crop-handle crop-handle-ne" onMouseDown={(e) => handleCropStartHandle(e, 'ne')}></div>
                          <div className="crop-handle crop-handle-sw" onMouseDown={(e) => handleCropStartHandle(e, 'sw')}></div>
                          <div className="crop-handle crop-handle-se" onMouseDown={(e) => handleCropStartHandle(e, 'se')}></div>
                        </div>
                      </div>
                      <div className="cropper-buttons">
                        <button onClick={confirmCrop} className="crop-confirm">确定</button>
                        <button onClick={cancelCrop} className="crop-cancel">取消</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="avatar-box" onClick={openAvatarDialog} role="button" aria-label="上传头像">
                      {agent.avatar ? (
                        <img src={agent.avatar} alt="avatar" />
                      ) : (
                        <div className="avatar-placeholder">点击上传头像</div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarSelect} />
                  </>
                )}
              </div>
            </div>

            {/* 第二个框：代号、玩家、年龄、性别、出生地 */}
            <div className="agent-info-box personal-info-box">
              <div className="input-group">
                <label>代号:</label>
                <input 
                  type="text" 
                  value={agent.codename}
                  onChange={(e) => setAgent(prev => ({...prev, codename: e.target.value}))}
                  placeholder="输入特工代号"
                />
              </div>
              <div className="input-group">
                <label>玩家:</label>
                <input 
                  type="text" 
                  value={agent.realName}
                  onChange={(e) => setAgent(prev => ({...prev, realName: e.target.value}))}
                  placeholder="输入玩家姓名"
                />
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>年龄:</label>
                  <input
                    type="number"
                    className="numeric-input"
                    value={agent.age}
                    onChange={(e) => setAgent(prev => ({...prev, age: parseInt(e.target.value) || 0}))}
                    placeholder="输入年龄"
                  />
                </div>
                <div className="input-group">
                  <label>性别:</label>
                  <input 
                    type="text" 
                    value={agent.gender}
                    onChange={(e) => setAgent(prev => ({...prev, gender: e.target.value}))}
                    placeholder="输入性别"
                  />
                </div>
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>出生地:</label>
                  <input 
                    type="text" 
                    value={agent.birthPlace}
                    onChange={(e) => setAgent(prev => ({...prev, birthPlace: e.target.value}))}
                    placeholder="输入出生地"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 下层：黑市币与生命值框 */}
          <div className="agent-info-box coins-status-box">
            <div className="input-row">
              <div className="input-group">
                <label>初始黑市币:</label>
                <div className="number-with-controls">
                  <input
                    type="number"
                    className="numeric-input"
                    value={agent.initialBlackCoin}
                    onChange={(e) => setAgent(prev => ({...prev, initialBlackCoin: parseInt(e.target.value) || 0}))}
                    placeholder="输入初始黑市币"
                  />
                  <div className="token-controls">
                    <button onClick={() => setAgent(prev => ({...prev, initialBlackCoin: Math.max(0, prev.initialBlackCoin - 1)}))}>-</button>
                    <button onClick={() => setAgent(prev => ({...prev, initialBlackCoin: prev.initialBlackCoin + 1}))}>+</button>
                  </div>
                </div>
              </div>
              <div className="input-group">
                <label>当前醉意值:</label>
                <div className="number-with-controls">
                  <input
                    type="number"
                    className="numeric-input"
                    value={agent.currentIntoxication}
                    onChange={(e) => {
                      const newIntoxication = parseInt(e.target.value) || 0
                      setAgent(prev => ({...prev, currentIntoxication: newIntoxication}))
                      // 当醉意值增加时，更新最高醉意值和生命值
                      if (newIntoxication > maxIntoxication) {
                        setMaxIntoxication(newIntoxication)
                        setCurrentHealth(10 + newIntoxication)
                      }
                    }}
                    placeholder="输入当前醉意值"
                  />
                  <div className="token-controls">
                    <button onClick={() => {
                      setAgent(prev => ({...prev, currentIntoxication: Math.max(0, prev.currentIntoxication - 1)}))
                    }}>-</button>
                    <button onClick={() => {
                      setAgent(prev => {
                        const newIntoxication = prev.currentIntoxication + 1
                        // 当醉意值增加时，同步增加生命值
                        if (newIntoxication > maxIntoxication) {
                          setMaxIntoxication(newIntoxication)
                          setCurrentHealth(10 + newIntoxication)
                        }
                        return {...prev, currentIntoxication: newIntoxication}
                      })
                    }}>+</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="input-row">
              <div className="input-group">
                <label>剩余黑市币:</label>
                <div className="number-with-controls">
                  <input
                    type="number"
                    className="numeric-input"
                    value={agent.remainingBlackCoin}
                    onChange={(e) => setAgent(prev => ({...prev, remainingBlackCoin: parseInt(e.target.value) || 0}))}
                    placeholder="输入剩余黑市币"
                  />
                  <div className="token-controls">
                    <button onClick={() => setAgent(prev => ({...prev, remainingBlackCoin: Math.max(0, prev.remainingBlackCoin - 1)}))}>-</button>
                    <button onClick={() => setAgent(prev => ({...prev, remainingBlackCoin: prev.remainingBlackCoin + 1}))}>+</button>
                  </div>
                </div>
              </div>
              <div className="input-group">
                <label>当前生命值:</label>
                <div className="number-with-controls">
                  <input
                    type="number"
                    className="numeric-input"
                    value={currentHealth}
                    onChange={(e) => {
                      const newHealth = Math.max(1, parseInt(e.target.value) || 1)
                      setCurrentHealth(newHealth)
                    }}
                    placeholder="手动编辑生命值"
                  />
                  <div className="token-controls">
                    <button onClick={() => setCurrentHealth(prev => Math.max(0, prev - 1))}>-</button>
                    <button onClick={() => setCurrentHealth(prev => prev + 1)}>+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 社会属性 */}
      <div className="section attributes">
        <h2>🌟 社会属性</h2>
        <div className="social-attributes-list">
          {(['wealth', 'power', 'prestige', 'network'] as const).map((key) => {
            const value = agent.socialAttributes[key]
            return (
              <div key={key} className="social-attribute-row">
                <div className="attr-name">{getSocialAttributeLabel(key)}</div>
                <div className="attr-description">
                  <input 
                    type="text"
                    placeholder="填入对应名词"
                    value={agent.socialAttributeDescriptions[key]}
                    onChange={(e) => setAgent(prev => ({
                      ...prev,
                      socialAttributeDescriptions: {
                        ...prev.socialAttributeDescriptions,
                        [key]: e.target.value
                      }
                    }))}
                  />
                </div>
                <div className="attr-controls">
                  <button 
                    onClick={() => handleAttributeChange(key, value - 1)}
                    disabled={value <= 0}
                  >-</button>
                  <span className="attr-value">{value}</span>
                  <button 
                    onClick={() => handleAttributeChange(key, value + 1)}
                    disabled={value >= 10}
                  >+</button>
                </div>
              </div>
            )
          })}
        </div>
        {/* 酒类代币 */}
        <div className="alcohol-tokens">
          <h3>🥂 酒类代币</h3>
          <div className="tokens-grid">
            {(['red','yellow','blue','green'] as const).map((color) => {
              const val = agent.alcoholTokens[color]
              const labels = { red: '红', yellow: '黄', blue: '蓝', green: '绿' }
              return (
                <div key={color} className="token-item social-attribute-row">
                  <div className={`token-label token-${color}`}>{labels[color]}</div>
                  <div className="token-input-wrap">
                    <input
                      type="number"
                      className={`token-input token-${color}`}
                      min={0}
                      value={val}
                      onChange={(e) => setAgent(prev => ({ ...prev, alcoholTokens: { ...prev.alcoholTokens, [color]: parseInt(e.target.value) || 0 } }))}
                    />
                  </div>
                  <div className="token-controls">
                    <button onClick={() => setAgent(prev => ({ ...prev, alcoholTokens: { ...prev.alcoholTokens, [color]: Math.max(0, val - 1) } }))}>-</button>
                    <button onClick={() => setAgent(prev => ({ ...prev, alcoholTokens: { ...prev.alcoholTokens, [color]: val + 1 } }))}>+</button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="alcohol-divider" />
        </div>
      </div>

          {/* 新增：酒类展示，横跨两列 */}
          <div className="section wine-section">
            <h2>🍶 酒</h2>
            <div className="bottle-grid">
              {bottles.map((b, idx) => (
                <div key={idx} className="bottle-item">
                  <div className="bottle-image" onClick={() => openBottleDialog(idx)} role="button" aria-label={`选择${b.name}图片`}>
                    {b.image ? (
                      <img src={b.image} alt={b.name} />
                    ) : (
                      <div className="bottle-placeholder">点击选择图片</div>
                    )}
                  </div>
                  <div className="bottle-name">{b.name}</div>
                </div>
              ))}
            </div>
            <input ref={bottleFileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBottleSelect} />
          </div>

      {/* 健康状况 */}
      <div className="section health">
        <h2>❤️ 健康状况</h2>
        <div className="health-grid">
          <div className="health-item">
            <label>生命值:</label>
            <div className="health-controls">
              <div className="number-with-controls">
                <input 
                  type="number" 
                  className="numeric-input"
                  value={agent.health.current}
                  onChange={(e) => handleHealthChange('current', parseInt(e.target.value) || 0)}
                  min="0"
                  max={agent.health.max}
                />
                <div className="token-controls">
                  <button onClick={() => handleHealthChange('current', Math.max(0, agent.health.current - 1))}>-</button>
                  <button onClick={() => handleHealthChange('current', Math.min(agent.health.max, agent.health.current + 1))}>+</button>
                </div>
              </div>
              <span>/ {agent.health.max}</span>
            </div>
          </div>
          <div className="health-item">
            <label>压力等级:</label>
            <div className="number-with-controls">
              <input 
                type="number" 
                className="numeric-input"
                value={agent.health.stress}
                onChange={(e) => handleHealthChange('stress', parseInt(e.target.value) || 0)}
                min="0"
                max="10"
              />
              <div className="token-controls">
                <button onClick={() => handleHealthChange('stress', Math.max(0, agent.health.stress - 1))}>-</button>
                <button onClick={() => handleHealthChange('stress', Math.min(10, agent.health.stress + 1))}>+</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 技能专长 */}
      <div className="section specialties">
        <h2>🎯 技能专长</h2>
        <div className="input-row">
          <input 
            type="text" 
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            placeholder="输入新专长"
            onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
          />
          <button onClick={addSpecialty}>添加专长</button>
        </div>
        <ul className="specialty-list">
          {agent.specialties.map((specialty, index) => (
            <li key={index}>
              <span>{specialty}</span>
              <button 
                onClick={() => setAgent(prev => ({
                  ...prev,
                  specialties: prev.specialties.filter((_, i) => i !== index)
                }))}
              >×</button>
            </li>
          ))}
        </ul>
      </div>

      {/* 装备管理 */}
      <div className="section equipment">
        <h2>🔧 装备与资源</h2>
        
        <div className="equipment-category">
          <h3>武器</h3>
          <div className="input-row">
            <input 
              type="text" 
              value={newWeapon}
              onChange={(e) => setNewWeapon(e.target.value)}
              placeholder="输入新武器"
              onKeyPress={(e) => e.key === 'Enter' && addItem('weapons', newWeapon, setNewWeapon)}
            />
            <button onClick={() => addItem('weapons', newWeapon, setNewWeapon)}>添加</button>
          </div>
          <ul>
            {agent.equipment.weapons.map((weapon, index) => (
              <li key={index}>{weapon}</li>
            ))}
          </ul>
        </div>

        <div className="equipment-category">
          <h3>装备</h3>
          <div className="input-row">
            <input 
              type="text" 
              value={newGadget}
              onChange={(e) => setNewGadget(e.target.value)}
              placeholder="输入新装备"
              onKeyPress={(e) => e.key === 'Enter' && addItem('gadgets', newGadget, setNewGadget)}
            />
            <button onClick={() => addItem('gadgets', newGadget, setNewGadget)}>添加</button>
          </div>
          <ul>
            {agent.equipment.gadgets.map((gadget, index) => (
              <li key={index}>{gadget}</li>
            ))}
          </ul>
        </div>

        <div className="equipment-category">
          <h3>联系人</h3>
          <div className="input-row">
            <input 
              type="text" 
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              placeholder="输入新联系人"
              onKeyPress={(e) => e.key === 'Enter' && addItem('contacts', newContact, setNewContact)}
            />
            <button onClick={() => addItem('contacts', newContact, setNewContact)}>添加</button>
          </div>
          <ul>
            {agent.equipment.contacts.map((contact, index) => (
              <li key={index}>{contact}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 秘密信息 */}
      <div className="section secrets">
        <h2>🔒 秘密档案</h2>
        <div className="input-group">
          <label>伪装身份:</label>
          <input 
            type="text" 
            value={agent.secrets.coverIdentity}
            onChange={(e) => setAgent(prev => ({
              ...prev,
              secrets: {...prev.secrets, coverIdentity: e.target.value}
            }))}
            placeholder="输入伪装身份"
          />
        </div>
        
        <div className="input-group">
          <label>已知化名:</label>
          <div className="input-row">
            <input 
              type="text" 
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              placeholder="输入新化名"
              onKeyPress={(e) => e.key === 'Enter' && addAlias()}
            />
            <button onClick={addAlias}>添加</button>
          </div>
          <ul>
            {agent.secrets.knownAliases.map((alias, index) => (
              <li key={index}>{alias}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// 辅助函数：获取社会属性显示标签
const getSocialAttributeLabel = (key: 'wealth' | 'power' | 'prestige' | 'network'): string => {
  const labels: Record<'wealth' | 'power' | 'prestige' | 'network', string> = {
    wealth: '财富',
    power: '权力',
    prestige: '声望',
    network: '人脉'
  }
  return labels[key] || key
}

export default CovertAgentSheet
