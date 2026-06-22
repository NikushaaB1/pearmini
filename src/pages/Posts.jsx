import { useNavigate } from 'react-router-dom'
import { Newspaper } from 'lucide-react'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import PageHeader from '../components/ui/PageHeader'
import PageBreadcrumb from '../components/ui/PageBreadcrumb'
import FeedComposer from '../components/feed/FeedComposer'
import FeedPostCard from '../components/feed/FeedPostCard'
import { useUserStore } from '../store/useUserStore'
import { getProfileAvatar } from '../services/avatarService'

export default function Posts() {
  const navigate = useNavigate()
  const { user, role, modelId, feedPosts, userAvatar, models, lastNewPostId } = useUserStore()

  const profileAvatar = getProfileAvatar({ role, modelId, models, userAvatar })
  const authorName = user?.displayName || user?.email || 'ელიტა'

  return (
    <PageTransition>
      <FadeInContainer>
        <div className="posts-page">
          <FadeInItem>
            <PageBreadcrumb to="/dashboard" label="მთავარი" />
          </FadeInItem>

          <FadeInItem>
            <div className="posts-composer-wrap">
              <FeedComposer
                user={user}
                modelId={modelId}
                avatar={profileAvatar}
                authorName={authorName}
                prominentAi
                defaultAiOpen
              />
            </div>
          </FadeInItem>

          <FadeInItem>
            <PageHeader
              eyebrow="სოციალური"
              icon={Newspaper}
              title="პოსტები"
              subtitle="გაუზიარე განახლება, ფოტო, რეაქცია და AI-ით ტექსტი გუნდს"
            />
          </FadeInItem>

          <div id="team-feed-list" className="feed-list">
            {feedPosts.length === 0 ? (
              <FadeInItem>
                <div className="feed-empty">
                  <p className="feed-empty-title">ჯერ პოსტები არ არის</p>
                  <p className="feed-empty-desc">იყავი პირველი — დაწერე რამე ზემოთ!</p>
                </div>
              </FadeInItem>
            ) : (
              feedPosts.map((post) => (
                <FadeInItem key={post.id}>
                  <FeedPostCard
                    post={post}
                    currentUid={user?.uid}
                    currentUserName={authorName}
                    currentUserAvatar={profileAvatar}
                    onNavigateProfile={(id) => navigate(`/models/${id}`)}
                    isNew={post.id === lastNewPostId}
                  />
                </FadeInItem>
              ))
            )}
          </div>
        </div>
      </FadeInContainer>
    </PageTransition>
  )
}
