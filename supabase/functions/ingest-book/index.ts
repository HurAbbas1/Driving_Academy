import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { books, chapters, subtopics, questions } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (books && books.length > 0) {
      const { error } = await supabaseAdmin.from('books').upsert(books)
      if (error) throw new Error(`Books insert failed: ${error.message}`)
    }
    if (chapters && chapters.length > 0) {
      const { error } = await supabaseAdmin.from('chapters').upsert(chapters)
      if (error) throw new Error(`Chapters insert failed: ${error.message}`)
    }
    if (subtopics && subtopics.length > 0) {
      const { error } = await supabaseAdmin.from('subtopics').upsert(subtopics)
      if (error) throw new Error(`Subtopics insert failed: ${error.message}`)
    }
    if (questions && questions.length > 0) {
      const { error } = await supabaseAdmin.from('questions').upsert(questions)
      if (error) throw new Error(`Questions insert failed: ${error.message}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
