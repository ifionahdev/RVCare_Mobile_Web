import { prisma } from "../config/prisma.js";

const success = (res, data, message, status = 200) =>
  res.status(status).json({ success: true, data, message });

const badRequest = (res, message) =>
  res.status(400).json({ success: false, message });
const notFound = (res, message) =>
  res.status(404).json({ success: false, message });

const positiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const statusDto = (status) => ({ id: status.statusId, name: status.statusName });
const petCareCategoryDto = (category) => ({
  id: category.categoryId,
  name: category.categoryName,
});
const videoCategoryDto = (category) => ({
  id: category.videoCategoryId,
  name: category.categoryName,
  videoCategory: category.categoryName,
});

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const youtubeVideoId = (value) => {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = "";

    if (hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments[0] === "watch") {
        videoId = url.searchParams.get("v") ?? "";
      } else if (["embed", "shorts", "live"].includes(segments[0])) {
        videoId = segments[1] ?? "";
      }
    }

    return /^[A-Za-z0-9_-]{6,20}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
};

const isYouTubeUrl = (value) => youtubeVideoId(value) !== null;

const tipInclude = {
  icon: true,
  publicationStatus: true,
  contentCategory: true,
};

const videoInclude = {
  category: true,
  publicationStatus: true,
};

const tipDto = (tip) => ({
  id: tip.tipId,
  title: tip.title,
  shortDescription: tip.shortDescription ?? "",
  detailedContent: tip.detailedContent ?? "",
  learnMoreURL: tip.linkUrl,
  iconID: tip.iconId,
  icon: tip.icon?.iconKey ?? tip.icon?.iconName ?? "",
  petCareCategoryID: tip.contentCategoryId,
  category: tip.contentCategory?.categoryName ?? "",
  pubStatusID: tip.publicationStatusId,
  status: tip.publicationStatus?.statusName ?? "Draft",
  createdAt: tip.createdAt,
  updatedAt: tip.updatedAt,
});

const videoDto = (video) => ({
  id: video.videoId,
  title: video.title,
  videoTitle: video.title,
  videoURL: video.videoUrl,
  category: video.category.categoryName,
  videoCategoryID: video.categoryId,
  pubStatusID: video.publicationStatusId,
  status: video.publicationStatus.statusName,
  createdAt: video.createdAt,
  updatedAt: video.updatedAt,
});

const readTipInput = (body = {}) => {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const shortDescription =
    typeof body.shortDescription === "string" ? body.shortDescription.trim() : "";
  const detailedContent =
    typeof body.detailedContent === "string" ? body.detailedContent.trim() : "";
  const linkUrl =
    typeof body.learnMoreURL === "string" ? body.learnMoreURL.trim() : "";
  const iconId = positiveInteger(body.iconID);
  const categoryId = positiveInteger(body.petCareCategoryID);
  const publicationStatusId = positiveInteger(body.pubStatusID ?? 1);

  if (!title || title.length > 100) {
    return { error: "Article title is required and must be 100 characters or fewer." };
  }
  if (!shortDescription || shortDescription.length > 180) {
    return { error: "Short description is required and must be 180 characters or fewer." };
  }
  if (!detailedContent || detailedContent.length > 500) {
    return { error: "Detailed content is required and must be 500 characters or fewer." };
  }
  if (!linkUrl || linkUrl.length > 255 || !isHttpUrl(linkUrl)) {
    return { error: "Enter a valid HTTP or HTTPS link of 255 characters or fewer." };
  }
  if (!iconId) return { error: "Select a valid article icon." };
  if (!categoryId) return { error: "Select a valid pet-care category." };
  if (!publicationStatusId) return { error: "Select a valid publication status." };

  return {
    data: {
      title,
      shortDescription,
      detailedContent,
      linkUrl,
      iconId,
      contentCategoryId: categoryId,
      publicationStatusId,
    },
  };
};

const readVideoInput = (body = {}) => {
  const title =
    typeof body.videoTitle === "string" ? body.videoTitle.trim() : "";
  const videoUrl = typeof body.videoURL === "string" ? body.videoURL.trim() : "";
  const categoryId = positiveInteger(body.videoCategoryID);
  const publicationStatusId = positiveInteger(body.pubStatusID ?? 1);

  if (!title || title.length > 120) {
    return { error: "Video title is required and must be 120 characters or fewer." };
  }
  if (!videoUrl || videoUrl.length > 500 || !isHttpUrl(videoUrl) || !isYouTubeUrl(videoUrl)) {
    return { error: "Enter a valid YouTube URL of 500 characters or fewer." };
  }
  if (!categoryId) return { error: "Select a valid video category." };
  if (!publicationStatusId) return { error: "Select a valid publication status." };

  return {
    data: {
      title,
      videoUrl,
      categoryId,
      publicationStatusId,
    },
  };
};

const validateTipReferences = async (data) => {
  const [category, icon, publicationStatus] = await Promise.all([
    prisma.petCareCategory.findFirst({
      where: { categoryId: data.contentCategoryId, isDeleted: false },
      select: { categoryId: true },
    }),
    prisma.petCareIcon.findUnique({
      where: { iconId: data.iconId },
      select: { iconId: true },
    }),
    prisma.publicationStatus.findUnique({
      where: { statusId: data.publicationStatusId },
      select: { statusId: true },
    }),
  ]);
  return { category, icon, publicationStatus };
};

const validateVideoReferences = async (data) => {
  const [category, publicationStatus] = await Promise.all([
    prisma.videoCategory.findFirst({
      where: { videoCategoryId: data.categoryId, isDeleted: false },
      select: { videoCategoryId: true },
    }),
    prisma.publicationStatus.findUnique({
      where: { statusId: data.publicationStatusId },
      select: { statusId: true },
    }),
  ]);
  return { category, publicationStatus };
};

const readCategoryName = (value) =>
  typeof value === "string" ? value.trim() : "";

export const getPublicationStatuses = async (req, res, next) => {
  try {
    const statuses = await prisma.publicationStatus.findMany({
      orderBy: { statusId: "asc" },
    });
    return success(res, statuses.map(statusDto));
  } catch (error) {
    return next(error);
  }
};

export const getPetCareCategories = async (req, res, next) => {
  try {
    const categories = await prisma.petCareCategory.findMany({
      where: { isDeleted: false },
      orderBy: { categoryName: "asc" },
    });
    return success(res, categories.map(petCareCategoryDto));
  } catch (error) {
    return next(error);
  }
};

export const createPetCareCategory = async (req, res, next) => {
  try {
    const name = readCategoryName(req.body?.petCareCategory ?? req.body?.categoryName);
    if (!name || name.length > 80) {
      return badRequest(res, "Category name is required and must be 80 characters or fewer.");
    }

    const category = await prisma.petCareCategory.upsert({
      where: { categoryName: name },
      update: { isDeleted: false },
      create: { categoryName: name },
    });
    return success(
      res,
      petCareCategoryDto(category),
      "Category created successfully.",
      201,
    );
  } catch (error) {
    return next(error);
  }
};

export const getPetCareIcons = async (req, res, next) => {
  try {
    const icons = await prisma.petCareIcon.findMany({
      orderBy: { iconId: "asc" },
    });
    return success(
      res,
      icons.map((icon) => ({
        id: icon.iconId,
        iconName: icon.iconName,
        iconKey: icon.iconKey,
        name: icon.iconName,
      })),
    );
  } catch (error) {
    return next(error);
  }
};

export const getPetCareTips = async (req, res, next) => {
  try {
    const tips = await prisma.petCareTip.findMany({
      where: { isDeleted: false, type: "Article" },
      include: tipInclude,
      orderBy: { tipId: "desc" },
    });
    return success(res, tips.map(tipDto));
  } catch (error) {
    return next(error);
  }
};

export const createPetCareTip = async (req, res, next) => {
  try {
    const fields = readTipInput(req.body);
    if (fields.error) return badRequest(res, fields.error);

    const references = await validateTipReferences(fields.data);
    if (!references.category) return badRequest(res, "The selected pet-care category is unavailable.");
    if (!references.icon) return badRequest(res, "The selected article icon is unavailable.");
    if (!references.publicationStatus) return badRequest(res, "The selected publication status is unavailable.");

    const tip = await prisma.petCareTip.create({
      data: {
        ...fields.data,
        type: "Article",
        uploaderAccountId: req.user.accountId,
      },
      include: tipInclude,
    });
    return success(res, tipDto(tip), "Article created successfully.", 201);
  } catch (error) {
    return next(error);
  }
};

export const updatePetCareTip = async (req, res, next) => {
  try {
    const tipId = positiveInteger(req.params.tipId);
    if (!tipId) return badRequest(res, "Invalid article ID.");

    const existing = await prisma.petCareTip.findFirst({
      where: { tipId, isDeleted: false, type: "Article" },
      select: { tipId: true },
    });
    if (!existing) return notFound(res, "Article not found.");

    const fields = readTipInput(req.body);
    if (fields.error) return badRequest(res, fields.error);
    const references = await validateTipReferences(fields.data);
    if (!references.category) return badRequest(res, "The selected pet-care category is unavailable.");
    if (!references.icon) return badRequest(res, "The selected article icon is unavailable.");
    if (!references.publicationStatus) return badRequest(res, "The selected publication status is unavailable.");

    const tip = await prisma.petCareTip.update({
      where: { tipId },
      data: fields.data,
      include: tipInclude,
    });
    return success(res, tipDto(tip), "Article updated successfully.");
  } catch (error) {
    return next(error);
  }
};

export const deletePetCareTip = async (req, res, next) => {
  try {
    const tipId = positiveInteger(req.params.tipId);
    if (!tipId) return badRequest(res, "Invalid article ID.");
    const result = await prisma.petCareTip.updateMany({
      where: { tipId, isDeleted: false, type: "Article" },
      data: { isDeleted: true },
    });
    if (!result.count) return notFound(res, "Article not found.");
    return success(res, null, "Article deleted successfully.");
  } catch (error) {
    return next(error);
  }
};

export const getVideoCategories = async (req, res, next) => {
  try {
    const categories = await prisma.videoCategory.findMany({
      where: { isDeleted: false },
      orderBy: { categoryName: "asc" },
    });
    return success(res, categories.map(videoCategoryDto));
  } catch (error) {
    return next(error);
  }
};

export const createVideoCategory = async (req, res, next) => {
  try {
    const name = readCategoryName(req.body?.videoCategory ?? req.body?.categoryName);
    if (!name || name.length > 80) {
      return badRequest(res, "Category name is required and must be 80 characters or fewer.");
    }

    const category = await prisma.videoCategory.upsert({
      where: { categoryName: name },
      update: { isDeleted: false },
      create: { categoryName: name },
    });
    return success(res, videoCategoryDto(category), "Category created successfully.", 201);
  } catch (error) {
    return next(error);
  }
};

export const getVideos = async (req, res, next) => {
  try {
    const videos = await prisma.contentVideo.findMany({
      where: { isDeleted: false, category: { is: { isDeleted: false } } },
      include: videoInclude,
      orderBy: { videoId: "desc" },
    });
    return success(res, videos.map(videoDto));
  } catch (error) {
    return next(error);
  }
};

export const getVideoMetadata = async (req, res, next) => {
  const videoUrl = typeof req.body?.videoURL === "string"
    ? req.body.videoURL.trim()
    : "";
  if (!isYouTubeUrl(videoUrl)) {
    return badRequest(res, "Enter a valid YouTube video URL.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const oembedUrl = new URL("https://www.youtube.com/oembed");
    oembedUrl.searchParams.set("url", videoUrl);
    oembedUrl.searchParams.set("format", "json");
    const response = await fetch(oembedUrl, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      return res.status(422).json({
        success: false,
        message: "Could not retrieve details for that YouTube video.",
      });
    }

    const metadata = await response.json();
    if (typeof metadata.title !== "string" || !metadata.title.trim()) {
      return res.status(422).json({
        success: false,
        message: "YouTube did not return a title for that video.",
      });
    }

    return success(res, {
      title: metadata.title.trim().slice(0, 120),
      thumbnailUrl:
        typeof metadata.thumbnail_url === "string"
          ? metadata.thumbnail_url
          : null,
    }, "YouTube video details retrieved.");
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({
        success: false,
        message: "Timed out while retrieving YouTube video details.",
      });
    }
    return next(error);
  } finally {
    clearTimeout(timeout);
  }
};

export const createVideo = async (req, res, next) => {
  try {
    const fields = readVideoInput(req.body);
    if (fields.error) return badRequest(res, fields.error);
    const references = await validateVideoReferences(fields.data);
    if (!references.category) return badRequest(res, "The selected video category is unavailable.");
    if (!references.publicationStatus) return badRequest(res, "The selected publication status is unavailable.");

    const video = await prisma.contentVideo.create({
      data: {
        ...fields.data,
        uploaderAccountId: req.user.accountId,
      },
      include: videoInclude,
    });
    return success(res, videoDto(video), "Video created successfully.", 201);
  } catch (error) {
    return next(error);
  }
};

export const updateVideo = async (req, res, next) => {
  try {
    const videoId = positiveInteger(req.params.videoId);
    if (!videoId) return badRequest(res, "Invalid video ID.");
    const existing = await prisma.contentVideo.findFirst({
      where: { videoId, isDeleted: false },
      select: { videoId: true },
    });
    if (!existing) return notFound(res, "Video not found.");

    const fields = readVideoInput(req.body);
    if (fields.error) return badRequest(res, fields.error);
    const references = await validateVideoReferences(fields.data);
    if (!references.category) return badRequest(res, "The selected video category is unavailable.");
    if (!references.publicationStatus) return badRequest(res, "The selected publication status is unavailable.");

    const video = await prisma.contentVideo.update({
      where: { videoId },
      data: fields.data,
      include: videoInclude,
    });
    return success(res, videoDto(video), "Video updated successfully.");
  } catch (error) {
    return next(error);
  }
};

export const deleteVideo = async (req, res, next) => {
  try {
    const videoId = positiveInteger(req.params.videoId);
    if (!videoId) return badRequest(res, "Invalid video ID.");
    const result = await prisma.contentVideo.updateMany({
      where: { videoId, isDeleted: false },
      data: { isDeleted: true },
    });
    if (!result.count) return notFound(res, "Video not found.");
    return success(res, null, "Video deleted successfully.");
  } catch (error) {
    return next(error);
  }
};

export const getPublishedPetCareContent = async (req, res, next) => {
  try {
    const [tips, videos] = await Promise.all([
      prisma.petCareTip.findMany({
        where: {
          isDeleted: false,
          type: "Article",
          publicationStatus: { is: { statusName: "Published" } },
        },
        include: tipInclude,
      }),
      prisma.contentVideo.findMany({
        where: {
          isDeleted: false,
          category: { is: { isDeleted: false } },
          publicationStatus: { is: { statusName: "Published" } },
        },
        include: videoInclude,
      }),
    ]);

    const articles = tips.map((tip) => ({
      id: tip.tipId,
      type: "article",
      title: tip.title,
      category: tip.contentCategory?.categoryName ?? "General",
      shortDescription: tip.shortDescription ?? "",
      detailedContent: tip.detailedContent ?? "",
      url: tip.linkUrl,
      icon: tip.icon?.iconKey ?? tip.icon?.iconName ?? "",
      createdAt: tip.createdAt,
    }));
    const publishedVideos = videos.map((video) => ({
      id: video.videoId,
      type: "video",
      title: video.title,
      category: video.category.categoryName,
      shortDescription: "Watch this video guide.",
      detailedContent: "",
      url: video.videoUrl,
      icon: "",
      createdAt: video.createdAt,
    }));
    const content = [...articles, ...publishedVideos].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );

    return success(res, content, "Published pet-care content retrieved.");
  } catch (error) {
    return next(error);
  }
};
