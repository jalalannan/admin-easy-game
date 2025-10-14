'use client';

import { create } from 'zustand';

interface DialogState {
  isOpen: boolean;
  type: 'request' | 'notification' | 'chat' | null;
  data: any;
  onClose?: () => void;
}

interface DialogActions {
  openDialog: (type: 'request' | 'notification' | 'chat', data: any, onClose?: () => void) => void;
  closeDialog: () => void;
}

export const useDialogStore = create<DialogState & DialogActions>((set) => ({
  isOpen: false,
  type: null,
  data: null,
  onClose: undefined,

  openDialog: (type, data, onClose) => {
    set({
      isOpen: true,
      type,
      data,
      onClose,
    });
  },

  closeDialog: () => {
    set({
      isOpen: false,
      type: null,
      data: null,
      onClose: undefined,
    });
  },
}));
