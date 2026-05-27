'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useGenerationStore } from '@/store/generationStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import type { Assignment, GenerationProgressEvent } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '/api/v1';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || (typeof window !== 'undefined' ? window.location.origin : '');

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { withCredentials: true, autoConnect: false });
  }
  return socket;
}

export function useSocket(assignmentId?: string) {
  const { setProgress, setCompleted, setFailed } = useGenerationStore();
  const { setCurrentAssignment } = useAssignmentStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;
    if (!s.connected) s.connect();

    function onProgress(data: GenerationProgressEvent) {
      if (!assignmentId || data.assignmentExternalId === assignmentId) {
        setProgress(data.progress, data.message);
      }
    }

    function onStarted(data: { assignmentExternalId: string; jobId: string }) {
      if (!assignmentId || data.assignmentExternalId === assignmentId) {
        setProgress(10, 'Starting generation');
      }
    }

    function onCompleted(data: { assignmentExternalId: string; assignment: Assignment }) {
      if (!assignmentId || data.assignmentExternalId === assignmentId) {
        setCompleted(data.assignment, `generation:${data.assignment.externalId}:${data.assignment.generationJobId ?? data.assignment.version}`);
        setCurrentAssignment(data.assignment);
      }
    }

    function onFailed(data: { assignmentExternalId: string; error: string }) {
      if (!assignmentId || data.assignmentExternalId === assignmentId) {
        setFailed(data.error);
      }
    }

    s.on('generation.progress', onProgress);
    s.on('generation.started', onStarted);
    s.on('generation.completed', onCompleted);
    s.on('generation.failed', onFailed);

    if (assignmentId) s.emit('join_assignment', assignmentId);

    return () => {
      s.off('generation.progress', onProgress);
      s.off('generation.started', onStarted);
      s.off('generation.completed', onCompleted);
      s.off('generation.failed', onFailed);
      if (assignmentId) s.emit('leave_assignment', assignmentId);
    };
  }, [assignmentId, setProgress, setCompleted, setFailed, setCurrentAssignment]);

  return socketRef.current;
}
