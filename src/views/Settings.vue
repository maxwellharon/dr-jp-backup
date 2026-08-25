<template>
  <div class="min-h-screen bg-slate-50">
    <NavBar />

    <main class="max-w-[1500px] mx-auto px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <!-- PAGE HEADER -->
      <section class="relative overflow-hidden rounded-[28px] bg-slate-950 shadow-xl">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.28),transparent_38%)]"></div>
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_30%)]"></div>

        <div class="relative px-6 py-7 md:px-8 md:py-9">
          <div class="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div class="max-w-3xl">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur"
                >
                  <i class="fas fa-sliders-h text-indigo-300"></i>
                </div>

                <div>
                  <p
                    class="text-[11px] font-bold uppercase tracking-[0.24em] text-indigo-300"
                  >
                    Administration
                  </p>

                  <p class="text-xs text-slate-400 mt-0.5">
                    Reporting & automation control
                  </p>
                </div>
              </div>

              <h1
                class="mt-5 text-3xl font-black tracking-tight text-white md:text-4xl"
              >
                Automation & Reporting
              </h1>

              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Configure intelligent reports, manage recipients, schedule
                delivery and review the full reporting activity trail from one
                place.
              </p>

              <div class="mt-5 flex flex-wrap gap-2">
                <span
                  class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Saved per operator
                </span>

                <span
                  class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300"
                >
                  <i class="fas fa-file-chart-line text-indigo-300"></i>
                  PDF reporting
                </span>

                <span
                  class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300"
                >
                  <i class="fas fa-clock text-cyan-300"></i>
                  Scheduled delivery
                </span>
              </div>
            </div>

            <div class="w-full xl:w-auto">
              <button
                type="button"
                @click="sendNow"
                :disabled="sending"
                class="group flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 xl:min-w-[190px]"
              >
                <span
                  class="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10"
                >
                  <i
                    class="fas"
                    :class="sending ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'"
                  ></i>
                </span>

                <span>
                  {{ sending ? 'Sending report...' : 'Send report now' }}
                </span>

                <i
                  v-if="!sending"
                  class="fas fa-arrow-right text-indigo-200 transition group-hover:translate-x-0.5"
                ></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- STATUS STRIP -->
      <section class="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div class="stat-card">
          <div class="stat-icon bg-indigo-50 text-indigo-600">
            <i class="fas fa-layer-group"></i>
          </div>

          <div class="min-w-0">
            <p class="stat-label">Report scope</p>
            <p class="stat-value capitalize">
              {{ scopeLabel }}
            </p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-cyan-50 text-cyan-600">
            <i class="fas fa-users"></i>
          </div>

          <div class="min-w-0">
            <p class="stat-label">Recipients</p>
            <p class="stat-value">
              {{ form.recipients.length }}
            </p>
          </div>
        </div>

        <div class="stat-card">
          <div
            class="stat-icon"
            :class="
              settings?.activatedAt
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-500'
            "
          >
            <i class="fas fa-calendar-check"></i>
          </div>

          <div class="min-w-0">
            <p class="stat-label">Automation</p>
            <p class="stat-value">
              {{ settings?.activatedAt ? 'Active' : 'Inactive' }}
            </p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-amber-50 text-amber-600">
            <i class="fas fa-envelope-open-text"></i>
          </div>

          <div class="min-w-0">
            <p class="stat-label">Email activity</p>
            <p class="stat-value">
              {{ emailLogs.length }}
            </p>
          </div>
        </div>
      </section>

      <!-- MAIN WORKSPACE -->
      <section class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <!-- LEFT -->
        <div class="min-w-0">
          <section
            class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
          >
            <!-- WORKFLOW HEADER -->
            <div
              class="border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/70 px-5 py-5 md:px-7"
            >
              <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="section-kicker">REPORT BUILDER</span>

                    <span
                      class="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600"
                    >
                      Step {{ currentStep + 1 }} / 4
                    </span>

                    <span
                      v-if="draftSaveState === 'saving'"
                      class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      <i class="fas fa-circle-notch fa-spin"></i>
                      Saving…
                    </span>

                    <span
                      v-else-if="draftSaveState === 'saved'"
                      class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600"
                    >
                      <i class="fas fa-check"></i>
                      Saved
                    </span>

                    <span
                      v-else-if="draftSaveState === 'error'"
                      class="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-600"
                      title="Your last change could not be saved. Check your connection."
                    >
                      <i class="fas fa-triangle-exclamation"></i>
                      Not saved
                    </span>
                  </div>

                  <h2 class="mt-2 text-xl font-black tracking-tight text-slate-900">
                    Configure your reporting workflow
                  </h2>

                  <p class="mt-1 text-sm text-slate-500">
                    Build once, save the configuration and reuse it whenever
                    you need the report.
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <div
                    v-for="n in 4"
                    :key="n"
                    class="h-2 rounded-full transition-all duration-300"
                    :class="
                      n - 1 <= currentStep
                        ? 'w-10 bg-indigo-600'
                        : 'w-5 bg-slate-200'
                    "
                  ></div>
                </div>
              </div>

              <!-- STEP NAVIGATION -->
              <div class="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
                <button
                  v-for="(step, index) in stepItems"
                  :key="step.id"
                  type="button"
                  @click="goToStep(index)"
                  class="step-nav"
                  :class="[
                    currentStep === index
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                      : index < currentStep
                        ? 'border-emerald-100 bg-emerald-50/60 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  ]"
                >
                  <span
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                    :class="
                      currentStep === index
                        ? 'bg-indigo-600 text-white'
                        : index < currentStep
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-500'
                    "
                  >
                    <i
                      v-if="index < currentStep"
                      class="fas fa-check"
                    ></i>

                    <span v-else>
                      {{ index + 1 }}
                    </span>
                  </span>

                  <span class="min-w-0 text-left">
                    <span class="block text-xs font-extrabold">
                      {{ step.label }}
                    </span>

                    <span
                      class="mt-0.5 hidden text-[10px] text-current/70 sm:block"
                    >
                      {{ step.description }}
                    </span>
                  </span>
                </button>
              </div>
            </div>

            <div class="p-5 md:p-7">
              <!-- STEP 1 -->
              <div
                v-if="currentStep === 0"
                class="animate-fade-in space-y-6"
              >
                <div>
                  <span class="section-kicker">01 · SCOPE</span>

                  <h3 class="mt-2 text-2xl font-black tracking-tight text-slate-900">
                    What do you want to report?
                  </h3>

                  <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Select the intelligence layer you need. You can combine
                    patient and website performance into one report.
                  </p>
                </div>

                <div class="grid gap-4 md:grid-cols-3">
                  <button
                    v-for="item in scopes"
                    :key="item.value"
                    type="button"
                    @click="selectScope(item.value)"
                    class="scope-card"
                    :class="
                      form.dataType === item.value
                        ? 'border-indigo-500 bg-indigo-50/80 ring-4 ring-indigo-100'
                        : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg'
                    "
                  >
                    <div class="flex items-start justify-between">
                      <span
                        class="flex h-12 w-12 items-center justify-center rounded-2xl"
                        :class="
                          form.dataType === item.value
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-indigo-600'
                        "
                      >
                        <i :class="item.icon" class="text-lg"></i>
                      </span>

                      <span
                        v-if="form.dataType === item.value"
                        class="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs text-indigo-600 shadow-sm"
                      >
                        <i class="fas fa-check"></i>
                      </span>
                    </div>

                    <div class="mt-6">
                      <h4 class="text-lg font-black text-slate-900">
                        {{ item.label }}
                      </h4>

                      <p class="mt-2 text-sm leading-5 text-slate-500">
                        {{ item.description }}
                      </p>
                    </div>

                    <div
                      class="mt-5 flex items-center gap-2 text-xs font-bold"
                      :class="
                        form.dataType === item.value
                          ? 'text-indigo-600'
                          : 'text-slate-400'
                      "
                    >
                      <span>
                        {{
                          form.dataType === item.value
                            ? 'Selected'
                            : 'Choose scope'
                        }}
                      </span>

                      <i class="fas fa-arrow-right"></i>
                    </div>
                  </button>
                </div>

                <div
                  class="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4"
                >
                  <div class="flex gap-3">
                    <div
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"
                    >
                      <i class="fas fa-lightbulb"></i>
                    </div>

                    <div>
                      <p class="text-sm font-bold text-slate-800">
                        Recommended setup
                      </p>

                      <p class="mt-1 text-xs leading-5 text-slate-600">
                        The combined report is the most useful operating view:
                        it connects patient demand with website acquisition and
                        engagement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- STEP 2 -->
              <div
                v-else-if="currentStep === 1"
                class="animate-fade-in space-y-7"
              >
                <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <span class="section-kicker">02 · FILTERS</span>

                    <h3 class="mt-2 text-2xl font-black tracking-tight text-slate-900">
                      Define the data window
                    </h3>

                    <p class="mt-2 text-sm leading-6 text-slate-500">
                      Narrow the report without changing your underlying
                      records.
                    </p>
                  </div>

                  <button
                    type="button"
                    @click="currentStep = 0"
                    class="text-sm font-bold text-slate-500 transition hover:text-indigo-600"
                  >
                    <i class="fas fa-arrow-left mr-2"></i>
                    Back to scope
                  </button>
                </div>

                <!-- PATIENT FILTERS -->
                <div
                  v-if="form.dataType !== 'web'"
                  class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5"
                >
                  <div class="mb-5 flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"
                    >
                      <i class="fas fa-user-injured"></i>
                    </div>

                    <div>
                      <h4 class="font-extrabold text-slate-900">
                        Patient intelligence
                      </h4>
                      <p class="text-xs text-slate-500">
                        Define the patient cohort included in the report.
                      </p>
                    </div>
                  </div>

                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <label class="label">Patient from</label>
                      <input
                        v-model="form.patientDateFrom"
                        type="date"
                        class="field"
                      />
                    </div>

                    <div>
                      <label class="label">Patient to</label>
                      <input
                        v-model="form.patientDateTo"
                        type="date"
                        class="field"
                      />
                    </div>

                    <div>
                      <label class="label">Procedure</label>
                      <select
                        v-model="form.procedureFilter"
                        class="field"
                      >
                        <option value="all">All procedures</option>
                        <option
                          v-for="procedure in procedures"
                          :key="procedure"
                          :value="procedure"
                        >
                          {{ procedure }}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label class="label">Country</label>
                      <input
                        v-model.trim="form.countryFilter"
                        class="field"
                        placeholder="All countries"
                      />
                    </div>
                  </div>

                  <label
                    class="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200"
                  >
                    <input
                      v-model="form.includePatientData"
                      type="checkbox"
                      class="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />

                    <span>
                      <span class="block text-sm font-bold text-slate-800">
                        Include detailed patient table
                      </span>

                      <span class="mt-1 block text-xs leading-5 text-slate-500">
                        Adds a patient-level table to the generated PDF for
                        operational review.
                      </span>
                    </span>
                  </label>
                </div>

                <!-- WEBSITE FILTERS -->
                <div
                  v-if="form.dataType !== 'patient'"
                  class="rounded-2xl border border-cyan-100 bg-cyan-50/30 p-4 md:p-5"
                >
                  <div class="mb-5 flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700"
                    >
                      <i class="fas fa-globe"></i>
                    </div>

                    <div>
                      <h4 class="font-extrabold text-slate-900">
                        Website intelligence
                      </h4>
                      <p class="text-xs text-slate-500">
                        Control the Google Analytics reporting window.
                      </p>
                    </div>
                  </div>

                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <label class="label">Website from</label>
                      <input
                        v-model="form.webDateFrom"
                        type="date"
                        class="field"
                      />
                    </div>

                    <div>
                      <label class="label">Website to</label>
                      <input
                        v-model="form.webDateTo"
                        type="date"
                        class="field"
                      />
                    </div>

                    <div>
                      <label class="label">Source</label>
                      <select
                        v-model="form.sourceFilter"
                        class="field"
                      >
                        <option value="all">All sources</option>

                        <option
                          v-for="source in trafficSources"
                          :key="source"
                          :value="source"
                        >
                          {{ source }}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label class="label">Country</label>
                      <select
                        v-model="form.webCountryFilter"
                        class="field"
                      >
                        <option value="all">All countries</option>

                        <option
                          v-for="country in countries"
                          :key="country"
                          :value="country"
                        >
                          {{ country }}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label class="label">Device</label>
                      <select
                        v-model="form.deviceFilter"
                        class="field"
                      >
                        <option value="all">All devices</option>

                        <option
                          v-for="device in devices"
                          :key="device"
                          :value="device"
                        >
                          {{ device }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end">
                  <button
                    type="button"
                    @click="currentStep = 2"
                    class="btn-primary"
                  >
                    Continue to recipients
                    <i class="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>

              <!-- STEP 3 -->
              <div
                v-else-if="currentStep === 2"
                class="animate-fade-in space-y-7"
              >
                <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <span class="section-kicker">03 · DELIVERY</span>

                    <h3 class="mt-2 text-2xl font-black tracking-tight text-slate-900">
                      Who should receive it?
                    </h3>

                    <p class="mt-2 text-sm leading-6 text-slate-500">
                      Add individual recipients or save reusable mailing lists.
                    </p>
                  </div>

                  <button
                    type="button"
                    @click="currentStep = 1"
                    class="text-sm font-bold text-slate-500 transition hover:text-indigo-600"
                  >
                    <i class="fas fa-arrow-left mr-2"></i>
                    Back to filters
                  </button>
                </div>

                <!-- RECIPIENT INPUT -->
                <div
                  class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5"
                >
                  <label class="label">Add recipient</label>

                  <div class="flex flex-col gap-2 sm:flex-row">
                    <input
                      v-model.trim="newEmail"
                      @keyup.enter="addEmail"
                      type="email"
                      class="field flex-1"
                      placeholder="recipient@example.com"
                    />

                    <button
                      type="button"
                      @click="addEmail"
                      class="btn-primary whitespace-nowrap"
                    >
                      <i class="fas fa-plus"></i>
                      Add recipient
                    </button>
                  </div>
                </div>

                <!-- CURRENT RECIPIENTS -->
                <div>
                  <div class="mb-3 flex items-center justify-between">
                    <div>
                      <h4 class="font-extrabold text-slate-900">
                        Current recipients
                      </h4>
                      <p class="text-xs text-slate-500">
                        {{ form.recipients.length }} recipient{{
                          form.recipients.length === 1 ? '' : 's'
                        }}
                        selected
                      </p>
                    </div>

                    <button
                      v-if="form.recipients.length"
                      type="button"
                      @click="form.recipients = []"
                      class="text-xs font-bold text-red-500 hover:text-red-600"
                    >
                      Clear all
                    </button>
                  </div>

                  <div
                    v-if="form.recipients.length"
                    class="grid gap-2 md:grid-cols-2"
                  >
                    <div
                      v-for="(email, index) in form.recipients"
                      :key="email"
                      class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
                    >
                      <div class="flex min-w-0 items-center gap-3">
                        <div
                          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"
                        >
                          <i class="fas fa-envelope"></i>
                        </div>

                        <span
                          class="truncate text-sm font-semibold text-slate-700"
                          :title="email"
                        >
                          {{ email }}
                        </span>
                      </div>

                      <button
                        type="button"
                        @click="removeEmail(index)"
                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        title="Remove recipient"
                      >
                        <i class="fas fa-times text-xs"></i>
                      </button>
                    </div>
                  </div>

                  <div
                    v-else
                    class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"
                  >
                    <div
                      class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm"
                    >
                      <i class="fas fa-user-plus"></i>
                    </div>

                    <p class="mt-3 text-sm font-bold text-slate-700">
                      No recipients yet
                    </p>

                    <p class="mt-1 text-xs text-slate-500">
                      Add at least one email address before activating or
                      sending a report.
                    </p>
                  </div>
                </div>

                <!-- MAILING LISTS -->
                <div class="border-t border-slate-100 pt-6">
                  <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                      <span class="section-kicker">SAVED GROUPS</span>

                      <h4 class="mt-1 font-extrabold text-slate-900">
                        Mailing lists
                      </h4>

                      <p class="mt-1 text-xs text-slate-500">
                        Save frequently used recipient groups and load them in
                        one click.
                      </p>
                    </div>

                    <span
                      class="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"
                    >
                      {{ mailingLists.length }} saved
                    </span>
                  </div>

                  <div class="flex flex-col gap-2 sm:flex-row">
                    <input
                      v-model.trim="mailingListName"
                      class="field flex-1"
                      placeholder="e.g. Management team"
                    />

                    <button
                      type="button"
                      @click="saveCurrentMailingList"
                      :disabled="!mailingListName.trim() || !form.recipients.length"
                      class="btn-secondary whitespace-nowrap"
                    >
                      <i class="fas fa-bookmark"></i>
                      Save list
                    </button>
                  </div>

                  <div
                    v-if="mailingLists.length"
                    class="mt-4 grid gap-3 md:grid-cols-2"
                  >
                    <button
                      v-for="list in mailingLists"
                      :key="list.id"
                      type="button"
                      @click="loadMailingList(list)"
                      class="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/30"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="flex min-w-0 items-center gap-3">
                          <div
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                          >
                            <i class="fas fa-users"></i>
                          </div>

                          <div class="min-w-0">
                            <p class="truncate text-sm font-extrabold text-slate-800">
                              {{ list.name }}
                            </p>

                            <p class="mt-1 text-xs text-slate-500">
                              {{ list.recipients?.length || 0 }}
                              recipients
                            </p>
                          </div>
                        </div>

                        <i class="fas fa-chevron-right text-xs text-slate-400"></i>
                      </div>
                    </button>
                  </div>

                  <p
                    v-else
                    class="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500"
                  >
                    No saved mailing lists yet. Save this recipient group for
                    future reports.
                  </p>
                </div>

                <div class="flex justify-end">
                  <button
                    type="button"
                    @click="currentStep = 3"
                    class="btn-primary"
                  >
                    Continue to schedule
                    <i class="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>

              <!-- STEP 4 -->
              <div
                v-else
                class="animate-fade-in space-y-7"
              >
                <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <span class="section-kicker">04 · AUTOMATION</span>

                    <h3 class="mt-2 text-2xl font-black tracking-tight text-slate-900">
                      Schedule delivery
                    </h3>

                    <p class="mt-2 text-sm leading-6 text-slate-500">
                      Decide how often this report should be delivered
                      automatically.
                    </p>
                  </div>

                  <button
                    type="button"
                    @click="currentStep = 2"
                    class="text-sm font-bold text-slate-500 transition hover:text-indigo-600"
                  >
                    <i class="fas fa-arrow-left mr-2"></i>
                    Back to recipients
                  </button>
                </div>

                <div class="grid gap-4 md:grid-cols-3">
                  <button
                    v-for="freq in frequencies"
                    :key="freq.value"
                    type="button"
                    @click="form.frequency = freq.value"
                    class="rounded-2xl border-2 p-5 text-left transition"
                    :class="
                      form.frequency === freq.value
                        ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100'
                        : 'border-slate-200 bg-white hover:border-indigo-200'
                    "
                  >
                    <div class="flex items-start justify-between">
                      <span
                        class="flex h-10 w-10 items-center justify-center rounded-xl"
                        :class="
                          form.frequency === freq.value
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-500'
                        "
                      >
                        <i :class="freq.icon"></i>
                      </span>

                      <span
                        v-if="form.frequency === freq.value"
                        class="text-xs text-indigo-600"
                      >
                        <i class="fas fa-check-circle"></i>
                      </span>
                    </div>

                    <p class="mt-4 text-base font-black capitalize text-slate-900">
                      {{ freq.label }}
                    </p>

                    <p class="mt-1 text-xs leading-5 text-slate-500">
                      {{ freq.description }}
                    </p>
                  </button>
                </div>

                <div
                  class="grid gap-5 md:grid-cols-2"
                >
                  <div
                    class="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <label class="label">Delivery time</label>

                    <div class="relative">
                      <input
                        v-model="form.time"
                        type="time"
                        class="field pr-12"
                      />

                      <div
                        class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        <i class="fas fa-clock"></i>
                      </div>
                    </div>

                    <p class="mt-2 text-xs text-slate-500">
                      Schedule uses the clinic's configured local timezone.
                    </p>
                  </div>

                  <div
                    class="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5"
                  >
                    <div class="flex items-start gap-3">
                      <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"
                      >
                        <i class="fas fa-shield-check"></i>
                      </div>

                      <div>
                        <p class="text-sm font-extrabold text-slate-900">
                          Ready to activate
                        </p>

                        <p class="mt-1 text-xs leading-5 text-slate-600">
                          Your configuration is stored with the authenticated
                          operator and will persist after reload or logout.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- PREVIEW -->
                <div
                  class="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 text-white"
                >
                  <div class="border-b border-white/10 px-5 py-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          Automation preview
                        </p>

                        <h4 class="mt-1 text-lg font-black">
                          {{ scopeLabel }}
                        </h4>
                      </div>

                      <span
                        class="rounded-full bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300"
                      >
                        Ready
                      </span>
                    </div>
                  </div>

                  <div class="grid divide-y divide-white/10 md:grid-cols-4 md:divide-x md:divide-y-0">
                    <div class="p-5">
                      <p class="preview-label">Frequency</p>
                      <p class="preview-value capitalize">
                        {{ form.frequency }}
                      </p>
                    </div>

                    <div class="p-5">
                      <p class="preview-label">Time</p>
                      <p class="preview-value">
                        {{ form.time || '09:00' }}
                      </p>
                    </div>

                    <div class="p-5">
                      <p class="preview-label">Recipients</p>
                      <p class="preview-value">
                        {{ form.recipients.length }}
                      </p>
                    </div>

                    <div class="p-5">
                      <p class="preview-label">Patient table</p>
                      <p class="preview-value">
                        {{ form.includePatientData ? 'Included' : 'Excluded' }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    @click="activate"
                    :disabled="!form.recipients.length"
                    class="btn-success justify-center"
                  >
                    <i class="fas fa-calendar-check"></i>
                    Activate & save schedule
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- RIGHT SIDEBAR -->
        <aside class="space-y-5">
          <!-- SAVED STATE -->
          <section class="side-card">
            <div class="flex items-start justify-between gap-4">
              <div>
                <span class="section-kicker">PERSISTENCE</span>

                <h3 class="mt-2 text-lg font-black text-slate-900">
                  Saved state
                </h3>
              </div>

              <span
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
              >
                <i class="fas fa-database"></i>
              </span>
            </div>

            <p class="mt-3 text-sm leading-6 text-slate-500">
              Your settings, mailing lists and report activity are tied to the
              currently authenticated operator rather than temporary browser
              state.
            </p>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <div class="mini-metric">
                <span>Mailing lists</span>
                <strong>{{ mailingLists.length }}</strong>
              </div>

              <div class="mini-metric">
                <span>Email logs</span>
                <strong>{{ emailLogs.length }}</strong>
              </div>
            </div>
          </section>

          <!-- AUTOMATION STATUS -->
          <section
            class="overflow-hidden rounded-[24px] border shadow-sm"
            :class="
              settings?.activatedAt
                ? 'border-emerald-200 bg-emerald-50/70'
                : 'border-slate-200 bg-white'
            "
          >
            <div class="p-5">
              <div class="flex items-start justify-between">
                <div>
                  <span
                    class="text-[10px] font-bold uppercase tracking-[0.18em]"
                    :class="
                      settings?.activatedAt
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    "
                  >
                    AUTOMATION
                  </span>

                  <h3
                    class="mt-2 text-lg font-black"
                    :class="
                      settings?.activatedAt
                        ? 'text-emerald-950'
                        : 'text-slate-900'
                    "
                  >
                    {{
                      settings?.activatedAt
                        ? 'Schedule active'
                        : 'No active schedule'
                    }}
                  </h3>
                </div>

                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl"
                  :class="
                    settings?.activatedAt
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-100 text-slate-400'
                  "
                >
                  <i
                    class="fas"
                    :class="
                      settings?.activatedAt
                        ? 'fa-bolt'
                        : 'fa-pause'
                    "
                  ></i>
                </div>
              </div>

              <div
                v-if="settings?.activatedAt"
                class="mt-5 rounded-2xl border border-emerald-200 bg-white/70 p-4"
              >
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Frequency
                    </p>

                    <p class="mt-1 text-sm font-extrabold capitalize text-slate-800">
                      {{ settings.frequency || form.frequency }}
                    </p>
                  </div>

                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Delivery
                    </p>

                    <p class="mt-1 text-sm font-extrabold text-slate-800">
                      {{ settings.time || form.time }}
                    </p>
                  </div>
                </div>
              </div>

              <p
                v-else
                class="mt-3 text-sm leading-6 text-slate-500"
              >
                Configure a schedule to automatically distribute reports to
                your saved recipients.
              </p>

              <button
                v-if="settings?.activatedAt"
                type="button"
                @click="cancelAutomation"
                class="mt-4 inline-flex items-center gap-2 text-sm font-bold text-red-600 transition hover:text-red-700"
              >
                <i class="fas fa-ban"></i>
                Cancel schedule
              </button>
            </div>
          </section>

          <!-- CURRENT CONFIG -->
          <section class="side-card">
            <div class="flex items-center justify-between">
              <div>
                <span class="section-kicker">CURRENT CONFIG</span>
                <h3 class="mt-2 text-lg font-black text-slate-900">
                  At a glance
                </h3>
              </div>

              <span
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"
              >
                <i class="fas fa-eye"></i>
              </span>
            </div>

            <div class="mt-5 space-y-3">
              <div class="config-row">
                <span>Scope</span>
                <strong class="capitalize">{{ scopeLabel }}</strong>
              </div>

              <div class="config-row">
                <span>Frequency</span>
                <strong class="capitalize">{{ form.frequency }}</strong>
              </div>

              <div class="config-row">
                <span>Time</span>
                <strong>{{ form.time || '09:00' }}</strong>
              </div>

              <div class="config-row">
                <span>Recipients</span>
                <strong>{{ form.recipients.length }}</strong>
              </div>

              <div class="config-row">
                <span>Patient table</span>
                <strong>
                  {{ form.includePatientData ? 'Included' : 'Excluded' }}
                </strong>
              </div>
            </div>
          </section>

          <!-- HELP -->
          <section class="rounded-[24px] border border-indigo-100 bg-indigo-50/70 p-5 shadow-sm">
            <div class="flex items-start gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"
              >
                <i class="fas fa-circle-info"></i>
              </div>

              <div>
                <p class="text-sm font-extrabold text-slate-900">
                  Workflow tip
                </p>

                <p class="mt-1 text-xs leading-5 text-slate-600">
                  Save mailing lists for recurring management, clinical or
                  marketing reports. This eliminates repetitive recipient entry.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <!-- EMAIL HISTORY -->
      <section
        class="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
      >
        <div
          class="border-b border-slate-100 px-5 py-5 md:px-7"
        >
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span class="section-kicker">AUDIT TRAIL</span>

              <h2 class="mt-2 text-xl font-black tracking-tight text-slate-900">
                Email history
              </h2>

              <p class="mt-1 text-sm text-slate-500">
                Every report send attempt is retained for the current operator.
              </p>
            </div>

            <div
              class="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-600"
            >
              <i class="fas fa-history text-slate-400"></i>
              {{ emailLogs.length }} total attempts
            </div>
          </div>
        </div>

        <div
          v-if="emailLogs.length"
          class="overflow-x-auto"
        >
          <table class="min-w-full">
            <thead class="bg-slate-50">
              <tr>
                <th class="table-head">Date</th>
                <th class="table-head">Recipients</th>
                <th class="table-head">Report</th>
                <th class="table-head">Status</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="log in emailLogs"
                :key="log.id"
                class="transition hover:bg-slate-50/70"
              >
                <td class="table-cell whitespace-nowrap">
                  {{ formatDate(log.sentAt) }}
                </td>

                <td class="table-cell min-w-[260px]">
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="recipient in log.recipients || []"
                      :key="recipient"
                      class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                    >
                      {{ recipient }}
                    </span>

                    <span
                      v-if="!(log.recipients || []).length"
                      class="text-slate-400"
                    >
                      —
                    </span>
                  </div>
                </td>

                <td class="table-cell font-semibold text-slate-700">
                  {{ log.reportType || 'Report' }}
                </td>

                <td class="table-cell">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                    :class="
                      log.success
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    "
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="
                        log.success
                          ? 'bg-emerald-500'
                          : 'bg-red-500'
                      "
                    ></span>

                    {{ log.success ? 'Sent successfully' : 'Failed' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-else
          class="px-6 py-14 text-center"
        >
          <div
            class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
          >
            <i class="fas fa-envelope-open-text text-lg"></i>
          </div>

          <h3 class="mt-4 text-sm font-extrabold text-slate-800">
            No email activity yet
          </h3>

          <p class="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
            Sent and failed report attempts will appear here automatically.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import NavBar from '../components/NavBar.vue'
import { useAutomationSettings } from '../composables/useAutomationSettings'
import { useAuth } from '../stores/auth'
import { useWixData } from '../composables/useWixData'
import { useGoogleAnalytics } from '../composables/useGoogleAnalytics'
import { useReportGeneration } from '../composables/useReportGeneration'

const {
  settings,
  emailLogs,
  mailingLists,
  loadSettings,
  saveSettings,
  loadEmailLogs,
  loadMailingLists,
  saveMailingList,
  sendReportEmail,
  cancelAutomation: cancelRemote,
  cleanup
} = useAutomationSettings()

const { procedures } = useWixData()
const { authReady } = useAuth()
const { gaData } = useGoogleAnalytics()

const {
  generateDetailedInsights,
  generateReportData
} = useReportGeneration()

const currentStep = ref(0)
const newEmail = ref('')
const mailingListName = ref('')
const sending = ref(false)
const settingsHydrated = ref(false)
// True while we are programmatically writing Firestore data into `form`.
// Prevents that programmatic write from being mistaken for a user edit and
// re-saved (which would just be a harmless no-op, but also prevents the
// very first snapshot from firing a save before we know what's really there).
const suppressAutosave = ref(true)
const draftSaveState = ref('idle') // 'idle' | 'saving' | 'saved' | 'error'

const scopes = [
  {
    value: 'patient',
    label: 'Patient',
    description:
      'Patient intelligence, registrations, procedures and commercial insights.',
    icon: 'fas fa-user-injured'
  },
  {
    value: 'web',
    label: 'Website',
    description:
      'Google Analytics performance, traffic, engagement and acquisition.',
    icon: 'fas fa-globe'
  },
  {
    value: 'both',
    label: 'Combined',
    description:
      'A consolidated view of patient demand and website performance.',
    icon: 'fas fa-layer-group'
  }
]

const frequencies = [
  {
    value: 'daily',
    label: 'Daily',
    description: 'Receive an automated operational snapshot every day.',
    icon: 'fas fa-sun'
  },
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'Ideal for recurring management and performance reviews.',
    icon: 'fas fa-calendar-week'
  },
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Best suited for strategic monthly reporting.',
    icon: 'fas fa-calendar-alt'
  }
]

const stepItems = [
  {
    id: 1,
    label: 'Scope',
    description: 'Choose data'
  },
  {
    id: 2,
    label: 'Filters',
    description: 'Refine records'
  },
  {
    id: 3,
    label: 'Recipients',
    description: 'Set delivery list'
  },
  {
    id: 4,
    label: 'Schedule',
    description: 'Automate delivery'
  }
]

const defaultForm = {
  dataType: 'both',
  includePatientData: false,

  patientDateFrom: '',
  patientDateTo: '',
  procedureFilter: 'all',
  countryFilter: '',

  webDateFrom: '',
  webDateTo: '',
  sourceFilter: 'all',
  webCountryFilter: 'all',
  deviceFilter: 'all',

  recipients: [],

  frequency: 'weekly',
  time: '09:00',

  activatedAt: null
}

const form = reactive({
  ...defaultForm,
  recipients: []
})

const trafficSources = computed(() => {
  return (gaData.value?.trafficSources || [])
    .map(row => row.sessionSource)
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => String(a).localeCompare(String(b)))
})

const countries = computed(() => {
  return (gaData.value?.topCountries || [])
    .map(row => row.country)
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => String(a).localeCompare(String(b)))
})

const devices = computed(() => {
  return (gaData.value?.deviceCategories || [])
    .map(row => row.deviceCategory)
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => String(a).localeCompare(String(b)))
})

const scopeLabel = computed(() => {
  const scope = scopes.find(item => item.value === form.dataType)
  return scope?.label || 'Combined'
})

function hydrateSaved(value) {
  suppressAutosave.value = true

  Object.assign(
    form,
    defaultForm,
    value || {},
    {
      recipients: Array.isArray(value?.recipients)
        ? [...value.recipients]
        : []
    }
  )

  // Let the Object.assign mutation above finish propagating through the
  // deep watcher below before autosave is allowed to react to real edits.
  nextTick(() => {
    suppressAutosave.value = false
  })
}

// Hydrate the form exactly once from the very first Firestore snapshot,
// whether or not a saved document actually exists yet.
//
// The old version only ran `if (value)`, which meant a brand-new operator
// with no saved doc (value stays null) never got marked as hydrated, so
// `suppressAutosave` (see below) was never released and their edits were
// never saved either. This is very likely the root cause of "my changes
// get erased on reload": the wizard only ever persisted anything when the
// final Activate button was clicked, so any progress made before that
// point only existed in memory and vanished on refresh/navigation.
watch(
  settings,
  value => {
    if (settingsHydrated.value) return

    if (value) {
      hydrateSaved(value)
    } else {
      suppressAutosave.value = false
    }

    settingsHydrated.value = true
  },
  { immediate: true }
)

// Debounced autosave: persist scope, filters, recipients and schedule to
// Firestore as the operator works through the wizard, not just when they
// reach the end and click "Activate & save schedule". This is what makes
// progress survive a reload, a tab close, or switching pages mid-way.
let autosaveTimer = null

function scheduleAutosave() {
  if (suppressAutosave.value || !settingsHydrated.value) return

  clearTimeout(autosaveTimer)
  draftSaveState.value = 'saving'

  autosaveTimer = setTimeout(async () => {
    try {
      // activatedAt is deliberately left out of every autosave write.
      // It should only ever change via activate() or cancelAutomation(),
      // so a mid-wizard edit can never silently cancel (or fabricate) an
      // already-active schedule. saveSettings() uses a merge write, so
      // omitting the field here leaves whatever is already stored intact.
      const { activatedAt, ...draft } = form

      await saveSettings({
        ...draft,
        recipients: [...form.recipients]
      })

      draftSaveState.value = 'saved'
    } catch (error) {
      draftSaveState.value = 'error'
    }
  }, 700)
}

watch(form, scheduleAutosave, { deep: true })

function selectScope(value) {
  form.dataType = value
  currentStep.value = 1
}

function goToStep(index) {
  if (index <= currentStep.value) {
    currentStep.value = index
    return
  }

  if (index === 2 && currentStep.value < 1) {
    currentStep.value = 1
    return
  }

  if (index === 3 && !form.recipients.length) {
    currentStep.value = 2
    return
  }

  currentStep.value = index
}

function addEmail() {
  const email = newEmail.value.trim().toLowerCase()

  if (!email) return

  if (!email.includes('@')) {
    alert('Please enter a valid email address.')
    return
  }

  if (form.recipients.includes(email)) {
    alert('That recipient is already on the list.')
    newEmail.value = ''
    return
  }

  form.recipients.push(email)
  newEmail.value = ''
}

function removeEmail(index) {
  form.recipients.splice(index, 1)
}

function loadMailingList(list) {
  form.recipients = Array.isArray(list?.recipients)
    ? [...list.recipients]
    : []
}

async function saveCurrentMailingList() {
  const name = mailingListName.value.trim()

  if (!name) {
    alert('Enter a mailing list name.')
    return
  }

  if (!form.recipients.length) {
    alert('Add at least one recipient before saving the list.')
    return
  }

  try {
    await saveMailingList(
      name,
      [...form.recipients]
    )

    mailingListName.value = ''

    alert('Mailing list saved successfully.')
  } catch (error) {
    alert(error?.message || 'Unable to save mailing list.')
  }
}

async function activate() {
  if (!form.recipients.length) {
    alert('Add at least one recipient before activating the schedule.')
    currentStep.value = 2
    return
  }

  try {
    await saveSettings({
      ...form,
      recipients: [...form.recipients],
      activatedAt: new Date()
    })

    alert('Automation schedule saved successfully.')

    currentStep.value = 0
  } catch (error) {
    alert(
      error?.message ||
      'Unable to save the automation schedule.'
    )
  }
}

async function cancelAutomation() {
  try {
    await cancelRemote()

    alert('Schedule cancelled successfully.')
  } catch (error) {
    alert(
      error?.message ||
      'Unable to cancel the schedule.'
    )
  }
}

function formatDate(value) {
  if (!value) return '—'

  let date

  try {
    if (value?.toDate) {
      date = value.toDate()
    } else {
      date = new Date(value)
    }
  } catch {
    return '—'
  }

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Nairobi'
  })
}

async function useGoogleAnalyticsRefreshForReport(dateFrom = '', dateTo = '') {
  const params = new URLSearchParams()

  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)

  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await fetch(`/api/ga-data${query}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || `GA refresh failed: ${response.status}`)
  }

  return data
}

async function sendNow() {
  if (!form.recipients.length) {
    alert('Add at least one recipient first.')
    currentStep.value = 2
    return
  }

  sending.value = true

  try {
    /*
     * PATIENT DATA
     */
    const patientFilters = {
      dateFrom: form.patientDateFrom,
      dateTo: form.patientDateTo,

      procedure:
        form.procedureFilter === 'all'
          ? ''
          : form.procedureFilter,

      country: form.countryFilter,

      nonSurgical: '',
      bmiHighRisk: false
    }

    const patientData =
      form.dataType === 'web'
        ? []
        : generateReportData(patientFilters)

    const reportData = {
      summary: {},
      patientAnalytics: null,
      timeSeries: [],
      topPages: [],
      topCountries: [],
      trafficSources: [],
      deviceCategories: [],
      userTypes: [],
      hourly: [],
      tables: [],
      aiInsights: [],
      images: []
    }

    /*
     * PATIENT REPORT
     */
    if (form.dataType !== 'web') {
      const insights = generateDetailedInsights(patientData)

      if (insights) {
        reportData.summary = {
          totalPatients: patientData.length,
          avgAge: insights.avgAge,
          avgBmi: insights.avgBmi,
          nonSurgicalPercent: insights.nonSurgPercent,
          totalQuotedValue: insights.totalValue,
          avgQuoteValue: insights.avgValue,
          highBmiCount: insights.highBmiCount,
          priorSurgeryCount: insights.pastSurgCount,
          avgWeight: insights.avgWeight,
          avgHeight: insights.avgHeight
        }

        // Full patient analytics payload. The server builds its own KPI
        // dashboard, deep AI insights, pie/bar charts and breakdown tables
        // from this rather than the handful of summary insights below, so
        // patient data gets the same depth of treatment as website data.
        reportData.patientAnalytics = {
          total: insights.total,

          avgAge: insights.avgAge,
          avgBmi: insights.avgBmi,
          avgWeight: insights.avgWeight,
          avgHeight: insights.avgHeight,

          nonSurgCount: insights.nonSurgCount,
          nonSurgPercent: insights.nonSurgPercent,

          totalValue: insights.totalValue,
          avgValue: insights.avgValue,

          highBmiCount: insights.highBmiCount,
          bmiCategories: insights.bmiCategories,

          pastSurgCount: insights.pastSurgCount,

          procedures: insights.allProcedures,
          procedureValueBreakdown: insights.procedureValueBreakdown,

          countries: insights.countryDistribution,

          ageGroups: insights.ageGroups,

          monthlyTrend: insights.monthlyTrend
        }

        // A handful of high-level insights are still sent as a fallback /
        // supplement; the server generates a much larger, deeper set from
        // patientAnalytics above and dedupes against these automatically.
        reportData.aiInsights.push(
          {
            type: 'patient',
            title: 'Procedure demand',
            message:
              `${insights.mostRequested} is the leading request at ` +
              `${insights.mostRequestedCount} of ${insights.total} records.`,
            action:
              'Align service capacity, content and lead follow-up around the strongest demand.'
          },
          {
            type: 'patient',
            title: 'Age mix',
            message:
              `Average patient age is ${insights.avgAge} years. ` +
              `${insights.dominantAgeGroup} is the largest identifiable age segment.`,
            action:
              'Use the strongest demographic segment when prioritizing creative and campaign messaging.'
          },
          {
            type: 'patient',
            title: 'Non-surgical demand',
            message:
              `${insights.nonSurgPercent}% of records are non-surgical.`,
            action:
              'Consider using non-surgical treatments as lower-friction entry points into the clinic.'
          },
          {
            type: 'patient',
            title: 'Geographic footprint',
            message:
              `${insights.dominantCountry} accounts for ` +
              `${insights.dominantCountryCount} of the captured records.`,
            action:
              'Prioritize localization, targeting and follow-up around the strongest geographic market.'
          },
          {
            type: 'patient',
            title: 'BMI profile',
            message:
              `${insights.highBmiCount} records have a BMI of 30 or higher.`,
            action:
              'Use this as a screening and clinical workflow signal rather than a standalone eligibility decision.'
          },
          {
            type: 'patient',
            title: 'Commercial value',
            message:
              `Average quoted value across the filtered cohort is KES ` +
              `${Number(insights.avgValue).toLocaleString('en-KE', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
              })}.`,
            action:
              'Track quoted value alongside lead volume to identify commercially meaningful demand.'
          }
        )
      }

      if (form.includePatientData) {
        reportData.tables.push({
          title: 'Patient Records',
          headers: [
            'Name',
            'Procedure',
            'Age',
            'Country',
            'BMI',
            'Price'
          ],
          rows: patientData.slice(0, 100).map(patient => [
            patient.name,
            patient.procedure,
            patient.age,
            patient.country,
            patient.bmi,
            patient.price
          ])
        })
      }
    }

    /*
     * WEBSITE DATA
     */
    if (form.dataType !== 'patient') {
      if (!gaData.value) {
        throw new Error(
          'Website analytics is not available yet.'
        )
      }

      // Refresh GA data for the selected web reporting period before building
      // the report. When no web dates are selected, the existing dashboard data
      // is reused.
      if (form.webDateFrom || form.webDateTo) {
        const refreshed = await useGoogleAnalyticsRefreshForReport(
          form.webDateFrom,
          form.webDateTo
        )

        if (refreshed) {
          gaData.value = refreshed
        }
      }

      const summary = gaData.value.summary || {}

      reportData.timeSeries = Array.isArray(gaData.value.timeSeries)
        ? [...gaData.value.timeSeries]
        : []

      reportData.topPages = Array.isArray(gaData.value.topPages)
        ? [...gaData.value.topPages]
        : []

      reportData.topCountries = Array.isArray(gaData.value.topCountries)
        ? [...gaData.value.topCountries]
        : []

      reportData.trafficSources = Array.isArray(gaData.value.trafficSources)
        ? [...gaData.value.trafficSources]
        : []

      reportData.deviceCategories = Array.isArray(gaData.value.deviceCategories)
        ? [...gaData.value.deviceCategories]
        : []

      reportData.userTypes = Array.isArray(gaData.value.userTypes)
        ? [...gaData.value.userTypes]
        : []

      reportData.hourly = Array.isArray(gaData.value.hourly)
        ? [...gaData.value.hourly]
        : []

      reportData.summary = {
        ...reportData.summary,

        totalUsers: Number(summary.totalUsers || 0),
        sessions: Number(summary.sessions || 0),
        pageViews: Number(summary.screenPageViews || 0),

        bounceRate: Number(
          Number(summary.bounceRate || 0).toFixed(1)
        ),

        engagementRate: Number(
          Number(summary.engagementRate || 0).toFixed(1)
        )
      }

      const trafficSource =
        gaData.value.trafficSources?.[0]?.sessionSource ||
        'Direct'

      const bestPage =
        gaData.value.topPages?.[0]?.pagePath ||
        '/'

      const mobileSessions =
        gaData.value.deviceCategories?.find(
          device => device.deviceCategory === 'mobile'
        )?.sessions || 0

      const mobilePercent =
        (
          (100 * Number(mobileSessions)) /
          Math.max(1, Number(summary.sessions || 0))
        ).toFixed(1)

      reportData.aiInsights.push(
        {
          type: 'web',
          title: 'Web acquisition',
          message:
            `${trafficSource} is currently the leading traffic source.`,
          action:
            'Maintain the strongest acquisition channel while gradually diversifying dependency.'
        },
        {
          type: 'web',
          title: 'Best page',
          message:
            `"${bestPage}" is the most visited page in the available dataset.`,
          action:
            'Prioritize CTA clarity, lead capture and content quality on this page.'
        },
        {
          type: 'web',
          title: 'Mobile',
          message:
            `Mobile contributes ${mobilePercent}% of sessions.`,
          action:
            'Treat mobile conversion quality as a primary website KPI.'
        },
        {
          type: 'web',
          title: 'Engagement health',
          message:
            `The current bounce rate is ${Number(summary.bounceRate || 0).toFixed(1)}%.`,
          action:
            Number(summary.bounceRate || 0) > 50
              ? 'Review landing-page relevance, page speed and content alignment.'
              : 'Continue monitoring while improving pages with the highest drop-off.'
        }
      )

      reportData.tables.push({
        title: 'Top Pages',
        headers: [
          'Page',
          'Views',
          'Sessions',
          'Bounce'
        ],
        rows: (gaData.value.topPages || []).map(page => [
          page.pagePath,
          page.screenPageViews,
          page.sessions,
          `${Number(page.bounceRate || 0).toFixed(1)}%`
        ])
      })

      reportData.tables.push({
        title: 'Traffic Sources',
        headers: [
          'Source',
          'Sessions',
          'Active Users'
        ],
        rows: (gaData.value.trafficSources || []).map(source => [
          source.sessionSource,
          source.sessions,
          source.activeUsers
        ])
      })
    }

    const reportType =
      form.dataType === 'both'
        ? 'Patient & Web Report'
        : form.dataType === 'web'
          ? 'Web Analytics Report'
          : 'Patient Report'

    const result = await sendReportEmail(
      [...form.recipients],
      reportData,
      reportType,
      {
        dateFrom:
          form.patientDateFrom ||
          form.webDateFrom ||
          '',
        dateTo:
          form.patientDateTo ||
          form.webDateTo ||
          ''
      }
    )

    if (!result.success) {
      throw new Error(
        result.error ||
        'The report could not be sent.'
      )
    }

    alert('Report sent successfully.')
  } catch (error) {
    alert(
      `Report failed: ${
        error?.message ||
        'Unknown error'
      }`
    )
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  await authReady

  // Authentication is fully restored before any Firestore listeners start.
  // This prevents startup reads from running against a null/partial user.
  await Promise.all([
    loadSettings(),
    loadEmailLogs(),
    loadMailingLists()
  ])
})

onUnmounted(() => {
  clearTimeout(autosaveTimer)
  cleanup()
})
</script>

<style scoped>
.label {
  display: block;
  margin-bottom: 0.45rem;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.field {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  padding: 0.78rem 0.9rem;
  outline: none;
  background: #fff;
  color: #0f172a;
  font-size: 0.875rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.field::placeholder {
  color: #94a3b8;
}

.field:hover {
  border-color: #cbd5e1;
}

.field:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.stat-card {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 1.25rem;
  background: #fff;
  padding: 1rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.stat-icon {
  display: flex;
  height: 2.7rem;
  width: 2.7rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.9rem;
}

.stat-label {
  color: #94a3b8;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.stat-value {
  margin-top: 0.2rem;
  overflow: hidden;
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-kicker {
  color: #94a3b8;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.16em;
}

.step-nav {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.7rem;
  border: 1px solid;
  border-radius: 1rem;
  padding: 0.65rem;
  text-align: left;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.scope-card {
  min-height: 230px;
  border-width: 2px;
  border-radius: 1.4rem;
  padding: 1.25rem;
  text-align: left;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.btn-primary,
.btn-secondary,
.btn-success {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  border-radius: 0.9rem;
  padding: 0.78rem 1rem;
  font-size: 0.82rem;
  font-weight: 800;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.btn-primary {
  color: #fff;
  background: #4f46e5;
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.18);
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-success:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-secondary {
  color: #334155;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.btn-secondary:hover:not(:disabled) {
  border-color: #c7d2fe;
  background: #eef2ff;
}

.btn-success {
  color: #fff;
  background: #059669;
  box-shadow: 0 8px 20px rgba(5, 150, 105, 0.18);
}

.btn-success:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-1px);
}

.side-card {
  border: 1px solid #e2e8f0;
  border-radius: 1.5rem;
  background: #fff;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.mini-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  padding: 0.7rem 0.8rem;
  background: #f8fafc;
}

.mini-metric span {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 700;
}

.mini-metric strong {
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 900;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #f1f5f9;
  padding: 0.75rem 0;
}

.config-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.config-row span {
  color: #64748b;
  font-size: 0.76rem;
}

.config-row strong {
  max-width: 55%;
  overflow: hidden;
  color: #0f172a;
  font-size: 0.78rem;
  font-weight: 900;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-label {
  color: #64748b;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.preview-value {
  margin-top: 0.35rem;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 900;
}

.table-head {
  padding: 0.8rem 1rem;
  color: #64748b;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.09em;
  text-align: left;
  text-transform: uppercase;
}

.table-cell {
  padding: 0.9rem 1rem;
  color: #64748b;
  font-size: 0.78rem;
}

.animate-fade-in {
  animation: fade-in 0.25s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .scope-card {
    min-height: auto;
  }

  .step-nav {
    padding: 0.55rem;
  }
}
</style>