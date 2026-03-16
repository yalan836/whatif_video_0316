import { useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { callAI, generateImage, generateVideo } from '../services/aiService';
import { buildStartGamePrompt, buildActionPrompt } from '../prompts/gamePrompts';
import { StoryboardItem, Character, LocationNode, Message } from '../types';
import { UI_STRINGS } from '../constants';

export function useGameActions() {
  const { gameState, setGameState, setOptions, resetGame, reweaveGame } = useGameStore();
  const { 
    setInput, setIsLoading, setShowWarning, setActiveTab, setSetupStep, 
    setIsGlitching, setIsConducting, setIsGeneratingImage, addNotification,
    resetUI, setVideoUrl
  } = useUIStore();
  const { apiSettings } = useSettingsStore();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevHpRef = useRef(100);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.history, useUIStore.getState().isGeneratingImage]);

  useEffect(() => {
    const { status, language } = useGameStore.getState().gameState;
    const { setupStep } = useUIStore.getState();
    
    if (status < 40 && prevHpRef.current >= 40 && setupStep === 'playing') {
      addNotification(language === 'zh' ? '血量过低，意识开始模糊' : 'HP low, consciousness fading', 'system');
    } else if (status >= 40 && prevHpRef.current < 40 && setupStep === 'playing') {
      addNotification(language === 'zh' ? '意识回复正常' : 'Consciousness restored', 'system');
    }
    prevHpRef.current = status;
  }, [gameState.status, gameState.language, useUIStore.getState().setupStep]);

  const handleReset = () => {
    if (confirm(UI_STRINGS[gameState.language].resetConfirm)) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      resetGame();
      resetUI();
      setSetupStep('language');
      setActiveTab('status');
    }
  };

  const handleReweave = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    reweaveGame();
    setInput('');
    setIsGeneratingImage(false);
    setIsLoading(false);
    
    setTimeout(() => {
      startGame();
    }, 100);
  };

  const handleNodeClick = (node: LocationNode) => {
    if (node.id === gameState.currentLocationId) {
      setInput(gameState.language === 'zh' ? `查看 ${node.name}` : `Inspect ${node.name}`);
    } else {
      setInput(gameState.language === 'zh' ? `前往 ${node.name}` : `Go to ${node.name}`);
    }
  };

  const handleLanguageSelect = (lang: 'en' | 'zh') => {
    setGameState(prev => ({ ...prev, language: lang }));
    setSetupStep('api');
  };

  const handleSetupWorld = (worldDesc: string) => {
    setGameState(prev => ({
      ...prev,
      world: { description: worldDesc, rules: [] }
    }));
    setSetupStep('character');
  };

  const handleSetupCharacter = (char: Character) => {
    setGameState(prev => ({
      ...prev,
      character: char
    }));
    setSetupStep('chapters');
  };

  const startGame = async () => {
    setSetupStep('playing');
    setGameState(prev => ({ ...prev, showGuide: true }));
    setIsLoading(true);
    setVideoUrl(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const introContent = `[size=18][b]Initializing Narrative...[/b][/size]

[color=amber][b]World:[/b][/color] ${gameState.world?.description}
[color=amber][b]Protagonist:[/b][/color] ${gameState.character?.name} (${gameState.character?.traits})

[b]Game Mechanics:[/b]
- [i]Chapters:[/i] ${gameState.totalChapters} Chapters to complete.
- [i]Rules:[/i] You must follow the World Rules. 1 new rule will be added each chapter.
- [i]Inventory:[/i] Items in your backpack will affect your status and physical state.
- [i]Endings:[/i] 
  - [color=emerald]Happy:[/color] < 2 violations AND > 70 status.
  - [color=red]Bad:[/color] > 4 violations OR 0 status.
  - [color=gray]Open:[/color] Otherwise.

[i]System: Generating world rules and initial scene...[/i]`;

    setGameState(prev => ({
      ...prev,
      history: [{
        id: 'intro-system',
        role: 'system',
        content: introContent,
        timestamp: Date.now()
      }]
    }));

    const systemPrompt = buildStartGamePrompt(
      gameState.language,
      gameState.world?.description || '',
      gameState.character!,
      gameState.totalChapters
    );

    let response = '';
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      if (signal.aborted) return;
      try {
        response = await callAI(apiSettings, [], systemPrompt);
        if (response.startsWith('Error:')) {
          throw new Error(response);
        }
        break;
      } catch (e) {
        console.error(`AI Call Attempt ${retryCount + 1} failed:`, e);
        retryCount++;
        if (retryCount > maxRetries) {
          if (!signal.aborted) {
            alert(gameState.language === 'zh' ? '连接世界失败，请检查网络或 API 设置。' : 'Failed to connect to the world. Please check network or API settings.');
            setIsLoading(false);
          }
          return;
        }
        await new Promise(res => setTimeout(res, 1500));
      }
    }

    if (signal.aborted) return;

    try {
      let jsonStr = response;
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else {
        const firstBrace = response.indexOf('{');
        const lastBrace = response.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = response.substring(firstBrace, lastBrace + 1);
        }
      }
      
      const data = JSON.parse(jsonStr.replace(/```json|```/g, ''));
      
      const startNode = data.map_nodes?.find((n: any) => n.status === 'current');
      if (startNode) {
        addNotification(startNode.name, 'location');
      }

      setGameState(prev => ({
        ...prev,
        world: { ...prev.world!, rules: data.rules },
        mapNodes: data.map_nodes || [],
        mapEdges: data.map_edges || [],
        currentLocationId: data.map_nodes?.find((n: any) => n.status === 'current')?.id || '',
        history: [
          ...prev.history,
          {
            id: 'start',
            role: 'assistant',
            content: data.scene,
            timestamp: Date.now()
          }
        ]
      }));
      setOptions(data.options || []);
      setSetupStep('playing');

      if (data.next_static_prompt) {
        setIsGeneratingImage(true);
        generateImage(apiSettings, data.next_static_prompt).then(imageUrl => {
          if (imageUrl) {
            const img = new Image();
            const complexity = data.action_complexity || 'Static';
            let duration = 3;
            if (complexity === 'Static') duration = 2;
            else if (complexity === 'Complex Interaction') duration = 5;

            const newStoryboardItem: StoryboardItem = {
              chapter: 1,
              step: 0,
              imageUrl: imageUrl,
              text: data.scene,
              actionText: data.next_static_prompt,
              actionComplexity: complexity as any,
              videoSpec: data.Video_Spec,
              videoDirector: data.video_director,
              nextStaticPrompt: data.next_static_prompt,
              videoUrl: (apiSettings.videoApiKey && data.video_director) ? 'pending' : undefined
            };

            const handleImageDone = () => {
              setGameState(prev => ({ 
                ...prev, 
                currentImage: signal.aborted ? prev.currentImage : imageUrl,
                storyboard: [...prev.storyboard, newStoryboardItem]
              }));
              if (!signal.aborted) setIsGeneratingImage(false);

              if (apiSettings.videoApiKey && data.video_director) {
                const vd = data.video_director;
                const videoPrompt = `Starting from the provided image, [Camera: ${vd.camera_shot.type}, ${vd.camera_shot.pov}, ${vd.camera_shot.movement}, ${vd.camera_shot.angle}]. ${vd.action_instruction}. ${vd.visual_consistency}. ${vd.lighting_change}. High fidelity, cinematically smooth.`;
                
                generateVideo(apiSettings, videoPrompt, imageUrl, duration).then(videoUrl => {
                  if (videoUrl) {
                    setGameState(prev => {
                      const updatedStoryboard = [...prev.storyboard];
                      const itemIndex = updatedStoryboard.findIndex(item => 
                        item.chapter === newStoryboardItem.chapter && item.step === newStoryboardItem.step
                      );
                      if (itemIndex !== -1) {
                        updatedStoryboard[itemIndex] = { ...updatedStoryboard[itemIndex], videoUrl: videoUrl };
                      }
                      return { ...prev, storyboard: updatedStoryboard, currentVideo: videoUrl };
                    });
                    // UI will handle onEnded to extract frame and set isGeneratingImage(false)
                  } else {
                    setGameState(prev => {
                      const updatedStoryboard = [...prev.storyboard];
                      const itemIndex = updatedStoryboard.findIndex(item => 
                        item.chapter === newStoryboardItem.chapter && item.step === newStoryboardItem.step
                      );
                      if (itemIndex !== -1) {
                        updatedStoryboard[itemIndex] = { ...updatedStoryboard[itemIndex], videoUrl: 'failed' };
                      }
                      return { ...prev, storyboard: updatedStoryboard };
                    });
                    if (!signal.aborted) setIsGeneratingImage(false);
                  }
                }).catch(e => {
                  console.error("Background video generation failed", e);
                  setGameState(prev => {
                    const updatedStoryboard = [...prev.storyboard];
                    const itemIndex = updatedStoryboard.findIndex(item => 
                      item.chapter === newStoryboardItem.chapter && item.step === newStoryboardItem.step
                    );
                    if (itemIndex !== -1) {
                      updatedStoryboard[itemIndex] = { ...updatedStoryboard[itemIndex], videoUrl: 'failed' };
                    }
                    return { ...prev, storyboard: updatedStoryboard };
                  });
                  if (!signal.aborted) setIsGeneratingImage(false);
                });
              }
            };

            img.onload = handleImageDone;
            img.onerror = handleImageDone;
            img.src = imageUrl;
          } else {
            setIsGeneratingImage(false);
          }
        }).catch(() => {
          if (!signal.aborted) setIsGeneratingImage(false);
        });
      }
    } catch (e) {
      console.error("Failed to parse AI response", e);
      console.error("Raw AI Response:", response);
      if (!signal.aborted) {
        setGameState(prev => ({
          ...prev,
          world: { ...prev.world!, rules: ["Don't talk to strangers", "Keep your light on", "Trust no one", "Stay hydrated", "Check your map"] },
          history: [...prev.history, { id: 'err', role: 'assistant', content: "The world begins to form...", timestamp: Date.now() }]
        }));
      }
    }
    if (!signal.aborted) setIsLoading(false);
  };

  const handleAction = async (action: string) => {
    const currentState = useGameStore.getState().gameState;
    const { isLoading } = useUIStore.getState();
    if (!action.trim() || isLoading || currentState.isGameOver) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: action,
      timestamp: Date.now()
    };

    const updatedHistory = [...currentState.history, newMessage];
    setGameState(prev => ({ ...prev, history: updatedHistory }));
    setInput('');
    setIsLoading(true);
    setVideoUrl(null);
    setIsConducting(true);
    setTimeout(() => {
      if (!signal.aborted) setIsConducting(false);
    }, 2000);

    const isRestAction = action.includes('[休息]') || action.includes('[Rest]');
    const newStepsSinceRest = isRestAction ? 0 : currentState.stepsSinceRest + 1;

    const systemPrompt = buildActionPrompt(currentState, newStepsSinceRest);

    let response = '';
    let retryCount = 0;
    const maxRetries = 2;

    const apiHistory = updatedHistory.map(m => {
      if (m.role === 'assistant') {
        return { ...m, content: JSON.stringify({ narrative: m.content }) };
      }
      return m;
    });

    while (retryCount <= maxRetries) {
      if (signal.aborted) return;
      try {
        response = await callAI(apiSettings, apiHistory, systemPrompt);
        if (response.startsWith('Error:')) {
          throw new Error(response);
        }
        break;
      } catch (e) {
        console.error(`AI Call Attempt ${retryCount + 1} failed:`, e);
        retryCount++;
        if (retryCount > maxRetries) {
          if (!signal.aborted) {
            setGameState(prev => ({
              ...prev,
              history: [...updatedHistory, {
                id: 'err',
                role: 'assistant',
                content: currentState.language === 'zh' 
                  ? "（世界线发生剧烈波动，你的意识暂时中断。请尝试重新连接或刷新页面。）" 
                  : "(The timeline fluctuates violently, your consciousness is temporarily interrupted. Please try reconnecting or refreshing the page.)",
                timestamp: Date.now()
              }]
            }));
            setIsLoading(false);
          }
          return;
        }
        await new Promise(res => setTimeout(res, 1500));
      }
    }
    
    if (signal.aborted) return;

    try {
      let jsonStr = response;
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else {
        const firstBrace = response.indexOf('{');
        const lastBrace = response.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = response.substring(firstBrace, lastBrace + 1);
        }
      }
      
      const data = JSON.parse(jsonStr.replace(/```json|```/g, ''));

      if (data.update.inventory_add && data.update.inventory_add.length > 0) {
        data.update.inventory_add.forEach((item: any) => {
          addNotification(item.name, 'item');
        });
      }

      if (data.update.map_nodes) {
        const newNodes = data.update.map_nodes.filter((n: any) => 
          !currentState.mapNodes.find(gn => gn.id === n.id) && n.status !== 'unknown'
        );
        newNodes.forEach((n: any) => {
          addNotification(n.name, 'location');
        });
      }

      setGameState(prev => {
        let newInventory = [...prev.inventory];
        if (data.update.inventory_add) {
          data.update.inventory_add.forEach((item: any) => {
            const existingIndex = newInventory.findIndex(i => i.name === item.name);
            if (existingIndex !== -1) {
              newInventory[existingIndex] = {
                ...newInventory[existingIndex],
                quantity: newInventory[existingIndex].quantity + (item.quantity || 1)
              };
            } else {
              newInventory.push({ 
                id: Math.random().toString(36).substr(2, 9), 
                name: item.name,
                description: item.description,
                quantity: item.quantity || 1
              });
            }
          });
        }
        if (data.update.inventory_remove) {
          data.update.inventory_remove.forEach((itemName: string) => {
            const existingIndex = newInventory.findIndex(i => i.name === itemName);
            if (existingIndex !== -1) {
              if (newInventory[existingIndex].quantity > 1) {
                newInventory[existingIndex] = {
                  ...newInventory[existingIndex],
                  quantity: newInventory[existingIndex].quantity - 1
                };
              } else {
                newInventory.splice(existingIndex, 1);
              }
            }
          });
        }

        const newUnlocked = [...prev.unlockedChapters];
        if (data.update.next_chapter > prev.currentChapter && !newUnlocked.includes(data.update.next_chapter)) {
          newUnlocked.push(data.update.next_chapter);
        }

        let newRules = [...(prev.world?.rules || [])];
        if (data.update.new_rule && data.update.next_chapter > prev.currentChapter) {
          newRules = [...newRules, data.update.new_rule];
        }

        if (data.update.violated_rule) {
          setShowWarning(true);
          setIsGlitching(true);
          setTimeout(() => {
            if (!signal.aborted) {
              setShowWarning(false);
              setIsGlitching(false);
            }
          }, 1000);
        }

        const newNodes = data.update.map_nodes || prev.mapNodes;
        const newEdges = data.update.map_edges || prev.mapEdges;
        const newCurrentId = newNodes.find((n: any) => n.status === 'current')?.id || prev.currentLocationId;
        
        const nextChapter = data.update.next_chapter ?? prev.currentChapter;
        const nextStatus = Math.max(0, Math.min(100, data.update.status ?? prev.status));
        const nextViolations = data.update.violations ?? prev.violations;
        const isGameOver = data.update.is_game_over || nextChapter > prev.totalChapters || nextStatus <= 0 || nextViolations > 4;

        return {
          ...prev,
          world: prev.world ? { ...prev.world, rules: newRules } : null,
          status: nextStatus,
          violations: nextViolations,
          inventory: newInventory,
          mapNodes: newNodes,
          mapEdges: newEdges,
          currentLocationId: newCurrentId,
          weather: data.update.weather ?? prev.weather,
          time: data.update.time ?? prev.time,
          currentStep: data.update.next_step ?? prev.currentStep,
          currentChapter: nextChapter > prev.totalChapters ? prev.totalChapters : nextChapter,
          unlockedChapters: newUnlocked,
          isGameOver: isGameOver,
          ending: data.update.ending ?? (isGameOver ? (nextStatus <= 0 || nextViolations > 4 ? 'Bad' : (nextViolations < 2 && nextStatus > 70 ? 'Happy' : 'Open')) : null),
          summary: data.update.summary ?? prev.summary,
          physicalStates: data.update.physical_states ?? prev.physicalStates,
          stepsSinceRest: newStepsSinceRest,
          history: [...updatedHistory, {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.narrative,
            timestamp: Date.now(),
            hpBreakdown: data.update.hp_breakdown
          }]
        };
      });
      setOptions(data.options || []);

      if (data.video_director && currentState.currentImage) {
        setIsGeneratingImage(true);
        const vd = data.video_director;
        const videoPrompt = `Starting from the provided image, [Camera: ${vd.camera_shot.type}, ${vd.camera_shot.pov}, ${vd.camera_shot.movement}, ${vd.camera_shot.angle}]. ${vd.action_instruction}. ${vd.visual_consistency}. ${vd.lighting_change}. High fidelity, cinematically smooth.`;
        const complexity = data.action_complexity || 'Simple Action';
        let duration = 3;
        if (complexity === 'Static') duration = 2;
        else if (complexity === 'Complex Interaction') duration = 5;

        const newStoryboardItem: StoryboardItem = {
          chapter: currentState.currentChapter,
          step: currentState.currentStep,
          imageUrl: currentState.currentImage, // Will be updated if fallback image is generated
          text: data.narrative,
          actionText: videoPrompt,
          actionComplexity: complexity as any,
          videoSpec: data.Video_Spec,
          videoDirector: data.video_director,
          nextStaticPrompt: data.next_static_prompt,
          videoUrl: apiSettings.videoApiKey ? 'pending' : undefined
        };

        // Add item to storyboard immediately so UI can show loading state
        setGameState(prev => ({
          ...prev,
          storyboard: [...prev.storyboard, newStoryboardItem]
        }));

        if (apiSettings.videoApiKey) {
          generateVideo(apiSettings, videoPrompt, currentState.currentImage, duration).then(videoUrl => {
            if (videoUrl) {
              setGameState(prev => {
                const updatedStoryboard = [...prev.storyboard];
                const itemIndex = updatedStoryboard.findIndex(item => 
                  item.chapter === newStoryboardItem.chapter && item.step === newStoryboardItem.step
                );
                if (itemIndex !== -1) {
                  updatedStoryboard[itemIndex] = { ...updatedStoryboard[itemIndex], videoUrl: videoUrl };
                }
                return { ...prev, storyboard: updatedStoryboard, currentVideo: videoUrl };
              });
              // UI will handle onEnded to extract frame and set isGeneratingImage(false)
            } else {
              // Video failed, fallback to image
              setGameState(prev => {
                const updatedStoryboard = [...prev.storyboard];
                const itemIndex = updatedStoryboard.findIndex(item => 
                  item.chapter === newStoryboardItem.chapter && item.step === newStoryboardItem.step
                );
                if (itemIndex !== -1) {
                  updatedStoryboard[itemIndex] = { ...updatedStoryboard[itemIndex], videoUrl: 'failed' };
                }
                return { ...prev, storyboard: updatedStoryboard };
              });
              
              if (data.next_static_prompt) {
                generateImage(apiSettings, data.next_static_prompt).then(imageUrl => {
                  if (imageUrl) {
                    setGameState(prev => {
                      const updatedStoryboard = [...prev.storyboard];
                      const itemIndex = updatedStoryboard.findIndex(item => 
                        item.chapter === newStoryboardItem.chapter && item.step === newStoryboardItem.step
                      );
                      if (itemIndex !== -1) {
                        updatedStoryboard[itemIndex] = { ...updatedStoryboard[itemIndex], imageUrl: imageUrl };
                      }
                      return { ...prev, currentImage: imageUrl, storyboard: updatedStoryboard };
                    });
                  }
                  if (!signal.aborted) setIsGeneratingImage(false);
                }).catch(() => {
                  if (!signal.aborted) setIsGeneratingImage(false);
                });
              } else {
                if (!signal.aborted) setIsGeneratingImage(false);
              }
            }
          }).catch(e => {
            console.error("Video generation failed", e);
            setGameState(prev => {
              const updatedStoryboard = [...prev.storyboard];
              const itemIndex = updatedStoryboard.findIndex(item => 
                item.chapter === newStoryboardItem.chapter && item.step === newStoryboardItem.step
              );
              if (itemIndex !== -1) {
                updatedStoryboard[itemIndex] = { ...updatedStoryboard[itemIndex], videoUrl: 'failed' };
              }
              return { ...prev, storyboard: updatedStoryboard };
            });
            
            if (data.next_static_prompt) {
              generateImage(apiSettings, data.next_static_prompt).then(imageUrl => {
                if (imageUrl) {
                  setGameState(prev => {
                    const updatedStoryboard = [...prev.storyboard];
                    const itemIndex = updatedStoryboard.findIndex(item => 
                      item.chapter === newStoryboardItem.chapter && item.step === newStoryboardItem.step
                    );
                    if (itemIndex !== -1) {
                      updatedStoryboard[itemIndex] = { ...updatedStoryboard[itemIndex], imageUrl: imageUrl };
                    }
                    return { ...prev, currentImage: imageUrl, storyboard: updatedStoryboard };
                  });
                }
                if (!signal.aborted) setIsGeneratingImage(false);
              }).catch(() => {
                if (!signal.aborted) setIsGeneratingImage(false);
              });
            } else {
              if (!signal.aborted) setIsGeneratingImage(false);
            }
          });
        } else {
          // No video API key, fallback to image
          if (data.next_static_prompt) {
            generateImage(apiSettings, data.next_static_prompt).then(imageUrl => {
              if (imageUrl) {
                setGameState(prev => {
                  const updatedStoryboard = [...prev.storyboard];
                  const itemIndex = updatedStoryboard.findIndex(item => 
                    item.chapter === newStoryboardItem.chapter && item.step === newStoryboardItem.step
                  );
                  if (itemIndex !== -1) {
                    updatedStoryboard[itemIndex] = { ...updatedStoryboard[itemIndex], imageUrl: imageUrl };
                  }
                  return { ...prev, currentImage: imageUrl, storyboard: updatedStoryboard };
                });
              }
              if (!signal.aborted) setIsGeneratingImage(false);
            }).catch(() => {
              if (!signal.aborted) setIsGeneratingImage(false);
            });
          } else {
            if (!signal.aborted) setIsGeneratingImage(false);
          }
        }
      } else if (data.next_static_prompt) {
        // Fallback if no video_director
        setIsGeneratingImage(true);
        generateImage(apiSettings, data.next_static_prompt).then(imageUrl => {
          if (imageUrl) {
            const newStoryboardItem: StoryboardItem = {
              chapter: currentState.currentChapter,
              step: currentState.currentStep,
              imageUrl: imageUrl,
              text: data.narrative,
              actionText: data.next_static_prompt,
              actionComplexity: data.action_complexity as any || 'Static',
              videoSpec: data.Video_Spec,
              nextStaticPrompt: data.next_static_prompt
            };
            setGameState(prev => ({ 
              ...prev, 
              currentImage: imageUrl,
              storyboard: [...prev.storyboard, newStoryboardItem]
            }));
          }
          if (!signal.aborted) setIsGeneratingImage(false);
        }).catch(() => {
          if (!signal.aborted) setIsGeneratingImage(false);
        });
      }
    } catch (e) {
      console.error("Failed to parse AI response", e);
      console.error("Raw AI Response:", response);
      if (!signal.aborted) {
        setGameState(prev => ({
          ...prev,
          history: [...updatedHistory, { id: 'err', role: 'assistant', content: "The world begins to form...", timestamp: Date.now() }]
        }));
      }
    }
    if (!signal.aborted) setIsLoading(false);
  };

  return {
    chatEndRef,
    handleReset,
    handleReweave,
    handleNodeClick,
    handleLanguageSelect,
    handleSetupWorld,
    handleSetupCharacter,
    startGame,
    handleAction
  };
}
