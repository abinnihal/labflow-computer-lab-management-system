
import React, { useState, useEffect } from 'react';
import { User, Post } from '../../types';
import { getPosts, createPost, likePost, votePoll, addComment, isUserBanned } from '../../services/communityService';

interface Props {
  user: User;
}

const EMOJI_LIST = ['😀','😂','😍','🤔','😎','👍','👎','🔥','❤️','🎉','🚀','💻','🐛','🎓','📚'];

const LearnersConsole: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'CLASS' | 'GLOBAL'>('CLASS');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Post Creator State
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'TEXT' | 'CODE' | 'POLL' | 'MEDIA' | 'FILE'>('TEXT');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Attachment States
  const [codeSnippet, setCodeSnippet] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  
  // Comment System State
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showCommentEmoji, setShowCommentEmoji] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    refreshPosts();
    setIsBanned(isUserBanned(user.id));
  }, [activeTab, user.id]);

  const refreshPosts = () => {
    setPosts(getPosts(activeTab));
  };

  const handleCreatePost = () => {
    setErrorMsg(null);
    if (!postContent.trim() && postType === 'TEXT') return;

    let newPostData: any = {
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      authorAvatar: user.avatarUrl,
      content: postContent,
      tags: [],
      scope: activeTab,
      type: postType
    };

    if (postType === 'CODE') {
      newPostData.codeSnippet = codeSnippet;
      newPostData.codeLanguage = 'javascript'; // Default for mock
    } else if (postType === 'POLL') {
      newPostData.pollOptions = pollOptions.filter(o => o.trim()).map((o, i) => ({ id: `opt-${i}`, label: o, votes: 0 }));
    } else if (postType === 'MEDIA') {
        newPostData.mediaType = 'IMAGE';
        newPostData.mediaUrls = ['https://picsum.photos/600/400']; 
    } else if (postType === 'FILE') {
        newPostData.fileName = 'document.pdf';
        newPostData.fileUrl = '#';
    }

    setIsPosting(true);
    setTimeout(() => {
        try {
          createPost(newPostData);
          setIsPosting(false);
          resetForm();
          refreshPosts();
        } catch (error: any) {
          setIsPosting(false);
          setErrorMsg(error.message);
          setTimeout(() => setErrorMsg(null), 3000);
        }
    }, 800);
  };

  const resetForm = () => {
      setPostContent('');
      setPostType('TEXT');
      setCodeSnippet('');
      setPollOptions(['', '']);
      setShowEmojiPicker(false);
  };

  const insertEmoji = (emoji: string) => {
      setPostContent(prev => prev + emoji);
      setShowEmojiPicker(false);
  };

  const insertCommentEmoji = (emoji: string) => {
      setCommentText(prev => prev + emoji);
      setShowCommentEmoji(false);
  }

  const handleVote = (postId: string, optionId: string) => {
      votePoll(postId, optionId);
      refreshPosts(); 
  };

  const handleLike = (postId: string) => {
      likePost(postId);
      refreshPosts();
  };

  const toggleComments = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      setCommentText('');
      setShowCommentEmoji(false);
    }
  };

  const handleSubmitComment = (postId: string) => {
    setErrorMsg(null);
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    
    setTimeout(() => {
      try {
        addComment(postId, {
          authorId: user.id,
          authorName: user.name,
          authorAvatar: user.avatarUrl,
          content: commentText
        });
        setCommentText('');
        setIsSubmittingComment(false);
        refreshPosts();
      } catch (error: any) {
        setIsSubmittingComment(false);
        setErrorMsg(error.message);
        setTimeout(() => setErrorMsg(null), 3000);
      }
    }, 500);
  };

  const renderPostContent = (post: Post) => {
      switch (post.type) {
          case 'CODE':
              return (
                  <div className="mt-3 bg-slate-900 rounded-lg p-4 overflow-x-auto border border-slate-700">
                      <pre className="text-sm font-mono text-green-400">{post.codeSnippet}</pre>
                  </div>
              );
          case 'POLL':
              const totalVotes = post.pollOptions?.reduce((acc, curr) => acc + curr.votes, 0) || 0;
              return (
                  <div className="mt-3 space-y-2">
                      {post.pollOptions?.map(opt => {
                          const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                          return (
                              <button 
                                key={opt.id} 
                                onClick={() => handleVote(post.id, opt.id)}
                                className="w-full relative h-10 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden text-left hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors group"
                              >
                                  <div className="absolute top-0 left-0 h-full bg-blue-100 dark:bg-blue-900/40 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                  <div className="absolute top-0 left-0 h-full w-full flex items-center justify-between px-4 z-10">
                                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{opt.label}</span>
                                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{percent}% ({opt.votes})</span>
                                  </div>
                              </button>
                          );
                      })}
                      <p className="text-xs text-slate-400 text-right">{totalVotes} votes</p>
                  </div>
              );
          case 'MEDIA':
              return (
                  <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      {post.mediaType === 'VIDEO' ? (
                          <div className="aspect-video bg-black flex items-center justify-center text-white">
                              <i className="fa-solid fa-play-circle text-4xl"></i>
                          </div>
                      ) : (
                          <img src={post.mediaUrls?.[0]} alt="Post attachment" className="w-full h-auto object-cover max-h-96" />
                      )}
                  </div>
              );
          case 'FILE':
              return (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                          <i className="fa-solid fa-file-arrow-down text-lg"></i>
                      </div>
                      <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{post.fileName || 'Attachment'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">PDF Document • 2.4 MB</p>
                      </div>
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"><i className="fa-solid fa-download"></i></button>
                  </div>
              );
          default:
              return null;
      }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-6 relative">
       {/* Error Toast */}
       {errorMsg && (
         <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-bounce">
           <i className="fa-solid fa-triangle-exclamation"></i>
           <span className="font-medium">{errorMsg}</span>
         </div>
       )}

       {/* Left Sidebar / Navigation */}
       <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-2">
             <button 
               onClick={() => setActiveTab('CLASS')}
               className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 mb-1 transition-colors ${activeTab === 'CLASS' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
             >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeTab === 'CLASS' ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                   <i className="fa-solid fa-users-rectangle"></i>
                </div>
                <div>
                   <p className="font-bold text-sm">My Class</p>
                   <p className="text-xs opacity-70">B.Tech CSE - 6th Sem</p>
                </div>
             </button>
             <button 
               onClick={() => setActiveTab('GLOBAL')}
               className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'GLOBAL' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
             >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeTab === 'GLOBAL' ? 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                   <i className="fa-solid fa-building-columns"></i>
                </div>
                <div>
                   <p className="font-bold text-sm">Global Campus</p>
                   <p className="text-xs opacity-70">All Departments</p>
                </div>
             </button>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-800 dark:to-purple-900 rounded-xl p-6 text-white shadow-lg hidden lg:block">
             <h3 className="font-bold text-lg mb-2">Trending Tags</h3>
             <div className="flex flex-wrap gap-2">
                {['#Hackathon', '#ExamPrep', '#Python', '#LostFound', '#Canteen'].map(tag => (
                   <span key={tag} className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs cursor-pointer transition-colors">{tag}</span>
                ))}
             </div>
          </div>
       </div>

       {/* Main Feed Area */}
       <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 sticky top-0 z-10">
             <h2 className="text-lg font-bold text-slate-800 dark:text-white">
               {activeTab === 'CLASS' ? 'Classroom Discussion' : 'College Global Feed'}
             </h2>
             <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                {posts.length + 12} Online
             </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
             <div className="max-w-3xl mx-auto p-4 space-y-6">
                
                {/* Post Creator or Banned Message */}
                {isBanned ? (
                   <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center shadow-sm">
                      <div className="w-14 h-14 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                         <i className="fa-solid fa-ban"></i>
                      </div>
                      <h3 className="font-bold text-red-800 dark:text-red-300 text-lg">Account Restricted</h3>
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">You have been banned from posting or commenting in the community console. Please contact the administrator.</p>
                   </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                     <div className="flex gap-3 mb-3">
                        <img src={user.avatarUrl || 'https://ui-avatars.com/api/?name=User'} className="w-10 h-10 rounded-full" alt="User" />
                        <div className="flex-1">
                           <textarea 
                             value={postContent}
                             onChange={(e) => setPostContent(e.target.value)}
                             className="w-full border-none focus:ring-0 text-slate-700 dark:text-slate-200 dark:bg-transparent placeholder-slate-400 resize-none h-20 p-0"
                             placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
                           ></textarea>
                           
                           {/* Dynamic Inputs based on type */}
                           {postType === 'CODE' && (
                              <textarea 
                                value={codeSnippet}
                                onChange={(e) => setCodeSnippet(e.target.value)}
                                className="w-full bg-slate-900 text-green-400 font-mono text-sm p-3 rounded-lg mt-2 h-32 focus:outline-none"
                                placeholder="// Paste your code snippet here..."
                              ></textarea>
                           )}

                           {postType === 'POLL' && (
                              <div className="mt-2 space-y-2 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                 {pollOptions.map((opt, i) => (
                                    <input 
                                      key={i}
                                      type="text"
                                      value={opt}
                                      onChange={(e) => {
                                         const newOpts = [...pollOptions];
                                         newOpts[i] = e.target.value;
                                         setPollOptions(newOpts);
                                      }}
                                      className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded px-3 py-1.5 text-sm"
                                      placeholder={`Option ${i+1}`}
                                    />
                                 ))}
                                 <button 
                                   onClick={() => setPollOptions([...pollOptions, ''])}
                                   className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                                 >
                                   + Add Option
                                 </button>
                              </div>
                           )}

                           {postType === 'FILE' && (
                              <div className="mt-2 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-4 text-center bg-slate-50 dark:bg-slate-700/30">
                                 <i className="fa-solid fa-file-pdf text-slate-400 text-xl mb-1"></i>
                                 <p className="text-sm text-slate-500 dark:text-slate-400">Document attached</p>
                              </div>
                           )}
                           
                           {postType === 'MEDIA' && (
                               <div className="mt-2 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-8 text-center bg-slate-50 dark:bg-slate-700/30">
                                 <i className="fa-regular fa-image text-slate-400 text-2xl mb-2"></i>
                                 <p className="text-sm text-slate-500 dark:text-slate-400">Image/Video selected</p>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700 relative">
                        <div className="flex gap-1">
                           <button 
                             onClick={() => setPostType(postType === 'MEDIA' ? 'TEXT' : 'MEDIA')}
                             className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors ${postType === 'MEDIA' ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : ''}`} title="Photo/Video"
                           >
                              <i className="fa-regular fa-image"></i>
                           </button>
                           <button 
                             onClick={() => setPostType(postType === 'FILE' ? 'TEXT' : 'FILE')}
                             className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors ${postType === 'FILE' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''}`} title="File"
                           >
                              <i className="fa-solid fa-paperclip"></i>
                           </button>
                           <button 
                             onClick={() => setPostType(postType === 'CODE' ? 'TEXT' : 'CODE')}
                             className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors ${postType === 'CODE' ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : ''}`} title="Code Snippet"
                           >
                              <i className="fa-solid fa-code"></i>
                           </button>
                           <button 
                             onClick={() => setPostType(postType === 'POLL' ? 'TEXT' : 'POLL')}
                             className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors ${postType === 'POLL' ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' : ''}`} title="Poll"
                           >
                              <i className="fa-solid fa-square-poll-horizontal"></i>
                           </button>
                           <button 
                             onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                             className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors" title="Emoji"
                           >
                              <i className="fa-regular fa-face-smile"></i>
                           </button>
                        </div>

                        {showEmojiPicker && (
                           <div className="absolute top-12 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg p-2 z-20 grid grid-cols-5 gap-1 w-48">
                              {EMOJI_LIST.map(emoji => (
                                 <button key={emoji} onClick={() => insertEmoji(emoji)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xl">{emoji}</button>
                              ))}
                           </div>
                        )}

                        <button 
                          onClick={handleCreatePost}
                          disabled={isPosting}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold text-sm shadow-md disabled:opacity-70 transition-all active:scale-95"
                        >
                           {isPosting ? 'Posting...' : 'Post'}
                        </button>
                     </div>
                  </div>
                )}

                {/* Posts Feed */}
                <div className="space-y-4">
                   {posts.map(post => (
                      <div key={post.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 transition-colors">
                         <div className="flex justify-between items-start mb-3">
                            <div className="flex gap-3">
                               <img src={post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName}`} className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-700" alt="Author" />
                               <div>
                                  <div className="flex items-center gap-2">
                                     <h4 className="font-bold text-slate-800 dark:text-white text-sm">{post.authorName}</h4>
                                     {post.authorRole === 'FACULTY' && <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Faculty</span>}
                                     <span className="text-slate-400 text-xs">• {new Date(post.timestamp).toLocaleString()}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{post.authorRole === 'STUDENT' ? 'Student' : 'Admin/Faculty'}</p>
                               </div>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><i className="fa-solid fa-ellipsis"></i></button>
                         </div>

                         <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {post.content}
                         </div>

                         {renderPostContent(post)}

                         {/* Post Actions */}
                         <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                            <button 
                              onClick={() => handleLike(post.id)}
                              disabled={isBanned}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${post.isLiked ? 'text-red-500 font-semibold' : ''}`}
                            >
                               <i className={`${post.isLiked ? 'fa-solid' : 'fa-regular'} fa-heart`}></i> {post.likes} <span className="hidden sm:inline">Likes</span>
                            </button>
                            <button 
                              onClick={() => toggleComments(post.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${expandedPostId === post.id ? 'bg-slate-50 dark:bg-slate-700/50 text-blue-600 dark:text-blue-400' : ''}`}
                            >
                               <i className="fa-regular fa-comment"></i> {post.comments} <span className="hidden sm:inline">Comments</span>
                            </button>
                            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ml-auto">
                               <i className="fa-solid fa-share"></i> <span className="hidden sm:inline">Share</span>
                            </button>
                         </div>

                         {/* Comments Section */}
                         {expandedPostId === post.id && (
                           <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 animate-fade-in-down">
                              {/* Comments List */}
                              <div className="space-y-4 mb-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                 {post.commentsList && post.commentsList.length > 0 ? (
                                   post.commentsList.map(comment => (
                                     <div key={comment.id} className="flex gap-3">
                                       <img src={comment.authorAvatar || `https://ui-avatars.com/api/?name=${comment.authorName}`} className="w-8 h-8 rounded-full border border-slate-100 dark:border-slate-700" alt="Commenter" />
                                       <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl rounded-tl-none p-3 flex-1">
                                          <div className="flex justify-between items-baseline mb-1">
                                             <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{comment.authorName}</span>
                                             <span className="text-[10px] text-slate-400">{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          <p className="text-xs text-slate-700 dark:text-slate-300">{comment.content}</p>
                                       </div>
                                     </div>
                                   ))
                                 ) : (
                                   <p className="text-center text-xs text-slate-400 italic py-2">No comments yet. Be the first!</p>
                                 )}
                              </div>

                              {/* Add Comment Input - Hidden if banned */}
                              {isBanned ? (
                                <p className="text-xs text-red-500 text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">Comments disabled due to account restriction.</p>
                              ) : (
                                <div className="flex gap-2 items-center relative">
                                   <img src={user.avatarUrl || 'https://ui-avatars.com/api/?name=User'} className="w-8 h-8 rounded-full" alt="User" />
                                   <div className="flex-1 relative">
                                      <input 
                                        type="text" 
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                                        placeholder="Write a comment..." 
                                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-blue-300 dark:text-white transition-colors"
                                      />
                                      <button 
                                        onClick={() => setShowCommentEmoji(!showCommentEmoji)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                      >
                                        <i className="fa-regular fa-face-smile"></i>
                                      </button>
                                      
                                      {showCommentEmoji && (
                                        <div className="absolute bottom-10 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg p-2 z-20 grid grid-cols-5 gap-1 w-48">
                                            {EMOJI_LIST.map(emoji => (
                                              <button key={emoji} onClick={() => insertCommentEmoji(emoji)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xl">{emoji}</button>
                                            ))}
                                        </div>
                                      )}
                                   </div>
                                   <button 
                                     onClick={() => handleSubmitComment(post.id)}
                                     disabled={isSubmittingComment || !commentText.trim()}
                                     className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:text-slate-300 dark:disabled:text-slate-600 p-2"
                                   >
                                     <i className="fa-solid fa-paper-plane"></i>
                                   </button>
                                </div>
                              )}
                           </div>
                         )}
                      </div>
                   ))}
                   
                   {posts.length === 0 && (
                      <div className="text-center py-10">
                         <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 text-2xl mx-auto mb-3">
                            <i className="fa-solid fa-comments"></i>
                         </div>
                         <p className="text-slate-500 dark:text-slate-400">No posts yet. Be the first to start a discussion!</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default LearnersConsole;
