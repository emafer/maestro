import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

// ── SCHOOLS ─────────────────────────────────────────────────────────
export function useSchools() {
  const { user } = useAuth()
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('schools').select('*')
      .eq('user_id', user.id).order('name')
    setSchools(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const COLORS = ['#E8A838','#5B8DD9','#E85858','#52C07A','#9B6DD9','#E8726E','#3BBFBF','#D97B3B']

  const add = async (s) => {
    const color = COLORS[schools.length % COLORS.length]
    const { data, error } = await supabase.from('schools')
      .insert({ ...s, user_id: user.id, color }).select().single()
    if (!error) setSchools(prev => [...prev, data])
    return { data, error }
  }

  const remove = async (id) => {
    const { error } = await supabase.from('schools').delete().eq('id', id)
    if (!error) setSchools(prev => prev.filter(s => s.id !== id))
    return { error }
  }

  return { schools, loading, add, remove, refresh: fetch }
}

// ── STUDENTS ─────────────────────────────────────────────────────────
export function useStudents() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('students').select('*')
      .eq('user_id', user.id).order('last_name').order('first_name')
    setStudents(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const add = async (s) => {
    const { data, error } = await supabase.from('students')
      .insert({ ...s, user_id: user.id }).select().single()
    if (!error) setStudents(prev => [...prev, data].sort((a,b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name)))
    return { data, error }
  }

  const update = async (id, patch) => {
    const { data, error } = await supabase.from('students')
      .update(patch).eq('id', id).select().single()
    if (!error) setStudents(prev => prev.map(s => s.id === id ? data : s))
    return { data, error }
  }

  const remove = async (id) => {
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (!error) setStudents(prev => prev.filter(s => s.id !== id))
    return { error }
  }

  return { students, loading, add, update, remove, refresh: fetch }
}

// ── LESSONS ──────────────────────────────────────────────────────────
export function useLessons() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('lessons').select('*')
      .eq('user_id', user.id).order('datetime', { ascending: false })
    setLessons(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const add = async (l) => {
    const { data, error } = await supabase.from('lessons')
      .insert({ ...l, user_id: user.id }).select().single()
    if (!error) setLessons(prev => [data, ...prev])
    return { data, error }
  }

  const update = async (id, patch) => {
    const { data, error } = await supabase.from('lessons')
      .update(patch).eq('id', id).select().single()
    if (!error) setLessons(prev => prev.map(l => l.id === id ? data : l))
    return { data, error }
  }

  const remove = async (id) => {
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    if (!error) setLessons(prev => prev.filter(l => l.id !== id))
    return { error }
  }

  return { lessons, loading, add, update, remove, refresh: fetch }
}

// ── PROFILE / SETTINGS ──────────────────────────────────────────────
export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('profiles').select('*')
      .eq('id', user.id).single()
    
    // Se il profilo non esiste (per vecchi utenti senza trigger), lo creiamo
    if (error && error.code === 'PGRST116') {
      const { data: newData } = await supabase.from('profiles')
        .insert({ id: user.id }).select().single()
      setProfile(newData)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const update = async (patch) => {
    const { data, error } = await supabase.from('profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', user.id).select().single()
    if (!error) setProfile(data)
    return { data, error }
  }

  return { profile, loading, update, refresh: fetch }
}
