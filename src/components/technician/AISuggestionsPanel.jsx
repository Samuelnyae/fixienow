import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Lightbulb, TrendingUp, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AISuggestionsPanel({ technician, completedJobs = [] }) {
  const [expanded, setExpanded] = useState(false);

  const { data: suggestions, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['aiSuggestions', technician?.id],
    queryFn: async () => {
      const recentJobs = completedJobs.slice(0, 10).map(j => ({
        category: j.category,
        price: j.final_price || j.estimated_price,
        rating: j.rating,
        date: j.created_date,
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful assistant for a home services technician app called FixNow.

Technician profile:
- Name: ${technician.name}
- Profession: ${technician.profession}
- Rating: ${technician.rating || 0}/5 (${technician.total_reviews || 0} reviews)
- Years experience: ${technician.years_experience || 'unknown'}
- Total jobs completed: ${technician.total_jobs || 0}
- Current hourly rate: KES ${technician.hourly_rate || 0}
- Service areas: ${(technician.service_areas || []).join(', ') || 'not specified'}
- Recent completed jobs: ${JSON.stringify(recentJobs)}

Based on this profile and performance data, provide personalized suggestions in the following categories:
1. skill_improvement: 1-2 tips to improve skill or get more jobs
2. pricing: pricing optimization advice based on market
3. availability: best times/days to be online based on demand patterns
4. growth: one concrete growth action they can take

Keep each suggestion short (1-2 sentences max). Be specific and actionable, not generic.`,
        response_json_schema: {
          type: 'object',
          properties: {
            skill_improvement: { type: 'array', items: { type: 'string' } },
            pricing: { type: 'string' },
            availability: { type: 'string' },
            growth: { type: 'string' },
            summary: { type: 'string', description: 'One sentence overall assessment' },
          }
        }
      });
      return result;
    },
    enabled: !!technician && expanded,
    staleTime: 1000 * 60 * 30, // 30 min cache
  });

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900 text-sm">AI Career Suggestions</p>
            <p className="text-xs text-gray-500">Personalized tips based on your performance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs">AI</Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {isLoading || isFetching ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Analyzing your profile...</p>
            </div>
          ) : suggestions ? (
            <>
              {suggestions.summary && (
                <div className="bg-white/70 rounded-xl p-3 border border-indigo-100">
                  <p className="text-sm text-indigo-800 font-medium">{suggestions.summary}</p>
                </div>
              )}

              <div className="grid gap-3">
                {/* Skill Tips */}
                {suggestions.skill_improvement?.length > 0 && (
                  <SuggestionCard
                    icon={<Lightbulb className="w-4 h-4 text-amber-600" />}
                    bg="bg-amber-50 border-amber-100"
                    title="Skill & Visibility Tips"
                    items={suggestions.skill_improvement}
                  />
                )}

                {/* Pricing */}
                {suggestions.pricing && (
                  <SuggestionCard
                    icon={<TrendingUp className="w-4 h-4 text-green-600" />}
                    bg="bg-green-50 border-green-100"
                    title="Pricing Advice"
                    items={[suggestions.pricing]}
                  />
                )}

                {/* Availability */}
                {suggestions.availability && (
                  <SuggestionCard
                    icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
                    bg="bg-blue-50 border-blue-100"
                    title="Availability Optimization"
                    items={[suggestions.availability]}
                  />
                )}

                {/* Growth */}
                {suggestions.growth && (
                  <SuggestionCard
                    icon={<Sparkles className="w-4 h-4 text-purple-600" />}
                    bg="bg-purple-50 border-purple-100"
                    title="Growth Action"
                    items={[suggestions.growth]}
                  />
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="w-full text-indigo-600 hover:bg-indigo-50 mt-1"
                disabled={isFetching}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh Suggestions
              </Button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({ icon, bg, title, items }) {
  return (
    <div className={`rounded-xl p-3 border ${bg}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <p className="text-xs font-semibold text-gray-700">{title}</p>
      </div>
      {items.map((item, i) => (
        <p key={i} className="text-xs text-gray-600 leading-relaxed">{item}</p>
      ))}
    </div>
  );
}