import * as React from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"

export interface ArticleCardProps {
  slug: string
  title: string
  excerpt: string
  image: string
  publishedAt: string
  readTime?: number
  category?: string
  index?: number
  className?: string
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

export const ArticleCard = React.forwardRef<HTMLDivElement, ArticleCardProps>(
  ({ slug, title, excerpt, image, publishedAt, readTime, category, index = 0, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ y: -8 }}
        className={cn("group", className)}
      >
        <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg">
          <Link 
            to={`/blog/${slug}`} 
            className="flex flex-col h-full text-decoration-none"
            aria-label={`Read article: ${title}`}
          >
            {/* Image Container */}
            <div className="relative overflow-hidden rounded-t-design-xl aspect-[4/3]">
              <img 
                src={image} 
                alt={title}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              
              {/* Article Badge/Tag */}
              {category && (
                <div className="absolute top-3 left-3">
                  <Badge variant="article" className="text-xs font-bold uppercase">
                    {category}
                  </Badge>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-grow p-6">
              {/* Title */}
              <h2 className="text-lg font-semibold mb-3 line-clamp-2 leading-tight text-design-text">
                {title}
              </h2>

              {/* Excerpt */}
              <p className="text-sm text-design-text-secondary mb-4 line-clamp-3 leading-relaxed flex-grow">
                {excerpt}
              </p>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-xs text-design-text-muted mb-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(publishedAt)}
                </span>
                {readTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {readTime} min
                  </span>
                )}
              </div>
            </div>
          </Link>
          
          {/* Read Article Button - Outside Link to avoid nesting issues */}
          <div className="px-6 pb-6">
            <Link to={`/blog/${slug}`} className="block">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-between"
              >
                Read Article
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    )
  }
)

ArticleCard.displayName = "ArticleCard"

export default ArticleCard
