import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import allWarmupsData from '@/data/warmups.json';
const DEFAULT_SESSION_DURATION_MINUTES = 10;
const EXERCISES_TO_PICK_MIN = 2;
const EXERCISES_TO_PICK_MAX = 3;
const allAvailableWarmups = ref([]);
const selectedExercises = ref([]);
const sessionDurationMinutes = ref(DEFAULT_SESSION_DURATION_MINUTES);
const timeLeftSeconds = ref(sessionDurationMinutes.value * 60);
const isSessionActive = ref(false);
const timerId = ref(null);
const sessionCompleteMessage = ref('');
const formattedTimeLeft = computed(() => {
    const minutes = Math.floor(timeLeftSeconds.value / 60);
    const seconds = timeLeftSeconds.value % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});
const mainButtonText = computed(() => {
    if (isSessionActive.value) {
        return `Session in Progress... (${formattedTimeLeft.value})`;
    }
    if (selectedExercises.value.length > 0) {
        return `Start ${sessionDurationMinutes.value}-Minute Warm-up Session`;
    }
    if (allAvailableWarmups.value.length === 0) {
        return 'No Warm-ups Available';
    }
    return 'Get Warm-up Exercises';
});
onMounted(() => {
    if (allWarmupsData && Array.isArray(allWarmupsData) && allWarmupsData.length > 0) {
        allAvailableWarmups.value = allWarmupsData;
    }
    else {
        console.warn('Warm-up data is empty, not an array, or not in the expected format.');
        allAvailableWarmups.value = [];
    }
    timeLeftSeconds.value = sessionDurationMinutes.value * 60;
});
onBeforeUnmount(() => {
    stopWarmupSession();
});
watch(sessionDurationMinutes, (newDuration) => {
    if (!isSessionActive.value) {
        timeLeftSeconds.value = newDuration * 60;
    }
});
const pickExercisesForSession = () => {
    if (allAvailableWarmups.value.length === 0) {
        selectedExercises.value = [];
        return;
    }
    const pool = [...allAvailableWarmups.value];
    const numToPick = Math.min(pool.length, Math.max(1, Math.floor(Math.random() * (EXERCISES_TO_PICK_MAX - EXERCISES_TO_PICK_MIN + 1)) + EXERCISES_TO_PICK_MIN));
    const picked = [];
    const usedIndices = new Set();
    let attempts = 0;
    const maxAttempts = pool.length * 2;
    while (picked.length < numToPick && usedIndices.size < pool.length && attempts < maxAttempts) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        if (!usedIndices.has(randomIndex)) {
            picked.push(pool[randomIndex]);
            usedIndices.add(randomIndex);
        }
        attempts++;
    }
    selectedExercises.value = picked;
    sessionCompleteMessage.value = '';
};
const startWarmupSession = () => {
    if (isSessionActive.value || selectedExercises.value.length === 0)
        return;
    isSessionActive.value = true;
    timeLeftSeconds.value = sessionDurationMinutes.value * 60;
    sessionCompleteMessage.value = '';
    timerId.value = setInterval(() => {
        if (timeLeftSeconds.value > 0) {
            timeLeftSeconds.value--;
        }
        else {
            stopWarmupSession();
            sessionCompleteMessage.value = `🎉 ${sessionDurationMinutes.value}-minute warm-up session complete! Great job!`;
            selectedExercises.value = [];
        }
    }, 1000);
};
const stopWarmupSession = (early = false) => {
    if (timerId.value !== null) {
        clearInterval(timerId.value);
        timerId.value = null;
    }
    isSessionActive.value = false;
    if (early) {
        sessionCompleteMessage.value = 'Warm-up session stopped early.';
    }
};
const handleGetOrStartWarmups = () => {
    if (selectedExercises.value.length === 0) {
        pickExercisesForSession();
    }
    else {
        startWarmupSession();
    }
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['stop-button']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-exercises-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['session-active-display']} */ ;
/** @type {__VLS_StyleScopedClasses['session-active-display']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['settings']} */ ;
/** @type {__VLS_StyleScopedClasses['settings']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "warmup-session-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
if (!__VLS_ctx.isSessionActive && !__VLS_ctx.allAvailableWarmups.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "message info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
}
if (!__VLS_ctx.isSessionActive && __VLS_ctx.selectedExercises.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "selected-exercises-preview" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
    for (const [exercise] of __VLS_getVForSourceType((__VLS_ctx.selectedExercises))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (exercise.id),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (exercise.name);
        if (exercise.examplePageUrl) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                href: (exercise.examplePageUrl),
                target: "_blank",
                rel: "noopener noreferrer",
                ...{ class: "example-link" },
            });
        }
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "controls" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.handleGetOrStartWarmups) },
    disabled: (__VLS_ctx.isSessionActive || (!__VLS_ctx.allAvailableWarmups.length && !__VLS_ctx.selectedExercises.length)),
});
(__VLS_ctx.mainButtonText);
if (__VLS_ctx.isSessionActive) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.isSessionActive))
                    return;
                __VLS_ctx.stopWarmupSession(true);
            } },
        ...{ class: "stop-button" },
    });
}
if (__VLS_ctx.isSessionActive) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "session-active-display" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.formattedTimeLeft);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
    for (const [exercise] of __VLS_getVForSourceType((__VLS_ctx.selectedExercises))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (exercise.id),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (exercise.name);
        if (exercise.examplePageUrl) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                href: (exercise.examplePageUrl),
                target: "_blank",
                rel: "noopener noreferrer",
                ...{ class: "example-link" },
            });
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "instruction" },
    });
}
if (__VLS_ctx.sessionCompleteMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "message completion" },
    });
    (__VLS_ctx.sessionCompleteMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "settings" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    for: "sessionDuration",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    id: "sessionDuration",
    value: (__VLS_ctx.sessionDurationMinutes),
    disabled: (__VLS_ctx.isSessionActive),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "1",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "10",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "12",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "15",
});
/** @type {__VLS_StyleScopedClasses['warmup-session-container']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['info']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-exercises-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['example-link']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['stop-button']} */ ;
/** @type {__VLS_StyleScopedClasses['session-active-display']} */ ;
/** @type {__VLS_StyleScopedClasses['example-link']} */ ;
/** @type {__VLS_StyleScopedClasses['instruction']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['completion']} */ ;
/** @type {__VLS_StyleScopedClasses['settings']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            allAvailableWarmups: allAvailableWarmups,
            selectedExercises: selectedExercises,
            sessionDurationMinutes: sessionDurationMinutes,
            isSessionActive: isSessionActive,
            sessionCompleteMessage: sessionCompleteMessage,
            formattedTimeLeft: formattedTimeLeft,
            mainButtonText: mainButtonText,
            stopWarmupSession: stopWarmupSession,
            handleGetOrStartWarmups: handleGetOrStartWarmups,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
